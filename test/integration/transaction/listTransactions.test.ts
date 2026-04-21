/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DefaultLogger,
  ListOperationResultStatus,
} from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import { SudoVirtualCardsSimulatorClient } from '@sudoplatform/sudo-virtual-cards-simulator'
import waitForExpect from 'wait-for-expect'
import {
  SudoVirtualCardsClient,
  Transaction,
  TransactionType,
  VirtualCard,
} from '../../../src'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'
import { runTestsIfSimulatorAvailable } from '../util/runTestsIf'
import { SudoUserClient } from '@sudoplatform/sudo-user'

describe('ListTransactions Test Suite', () => {
  jest.setTimeout(240000)
  waitForExpect.defaults.interval = 250
  waitForExpect.defaults.timeout = 10000

  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let optionalSimulator: SudoVirtualCardsSimulatorClient | undefined
  let profilesClient: SudoProfilesClient
  let fundingSourceProviders: FundingSourceProviders
  let userClient: SudoUserClient

  let sudo: Sudo

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    userClient = result.userClient
    sudo = result.sudo
    fundingSourceProviders = result.fundingSourceProviders
    optionalSimulator = result.virtualCardsSimulatorClient!
  })

  describe('ListTransactions', () => {
    it('should return empty transaction list', async () => {
      await expect(instanceUnderTest.listTransactions({})).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        items: [],
      })
    })
  })

  runTestsIfSimulatorAvailable(
    'ListTransactions - if simulator available',
    () => {
      describe('ListTransactions - if simulator available', () => {
        let simulator: SudoVirtualCardsSimulatorClient
        let card: VirtualCard

        const setupTransactions = async (): Promise<void> => {
          const [approvedMerchant, deniedMerchant] = await simulator
            .listSimulatorMerchants()
            .then((merchants) => {
              const approvedMerchant = merchants.find(
                (m) =>
                  m.declineBeforeAuthorization === false &&
                  m.declineAfterAuthorization === false,
              )
              const deniedMerchant = merchants.find(
                (m) => m.declineAfterAuthorization === true,
              )
              return [approvedMerchant, deniedMerchant]
            })
          if (!approvedMerchant || !deniedMerchant) {
            fail('expected merchants not found')
          }
          await Promise.all([
            simulator.simulateAuthorization({
              pan: card.pan,
              amount: 50,
              merchantId: approvedMerchant.id,
              expiry: card.expiry,
              billingAddress: card.billingAddress,
              csc: card.csc,
            }),
            simulator
              .simulateAuthorization({
                pan: card.pan,
                amount: 75,
                merchantId: approvedMerchant.id,
                expiry: card.expiry,
                billingAddress: card.billingAddress,
                csc: card.csc,
              })
              .then((auth) =>
                simulator.simulateDebit({
                  amount: 75,
                  authorizationId: auth.id,
                }),
              )
              .then((debit) =>
                simulator.simulateRefund({
                  amount: 75,
                  debitId: debit.id,
                }),
              ),
            simulator.simulateAuthorization({
              pan: card.pan,
              amount: 50,
              merchantId: deniedMerchant.id,
              expiry: card.expiry,
              billingAddress: card.billingAddress,
              csc: card.csc,
            }),
          ])

          await waitForExpect(async () => {
            const result = await instanceUnderTest.listTransactions({})
            expect(result.status).toEqual(ListOperationResultStatus.Success)
            if (result.status !== ListOperationResultStatus.Success) {
              fail('unexpected result')
            }
            expect(result.items).toHaveLength(4)
            const nPending = result.items.filter(
              (t) => t.type === TransactionType.Pending,
            ).length
            const nDeclined = result.items.filter(
              (t) => t.type === TransactionType.Decline,
            ).length
            const nDebit = result.items.filter(
              (t) => t.type === TransactionType.Complete,
            ).length
            const nRefund = result.items.filter(
              (t) => t.type === TransactionType.Complete,
            ).length
            expect(nPending).toEqual(1)
            expect(nDeclined).toEqual(1)
            expect(nDebit).toEqual(1)
            expect(nRefund).toEqual(1)
          })
        }

        beforeAll(async () => {
          simulator = optionalSimulator!

          card = await provisionVirtualCard(
            instanceUnderTest,
            profilesClient,
            sudo,
            fundingSourceProviders,
          )

          await setupTransactions()
        })

        it('returns expected result', async () => {
          // Set up callback to track sign-in guard behavior
          let callbackExecuted = false
          instanceUnderTest.setSignInCallback({
            signIn: async () => {
              callbackExecuted = true
              await Promise.resolve()
            },
          })

          const result = await instanceUnderTest.listTransactions({})

          if (result.status !== ListOperationResultStatus.Success) {
            fail(`result.status unexpectedly not Success`)
          }

          const pending = result.items.find(
            (t) => t.type === TransactionType.Pending,
          )
          expect(pending).toMatchObject<Partial<Transaction>>({
            billedAmount: { currency: 'USD', amount: 50 },
          })
          expect(pending?.settledAt).toBeFalsy()
          expect(pending?.declineReason).toBeFalsy()

          const complete = result.items.find(
            (t) => t.type === TransactionType.Complete,
          )
          expect(complete).toMatchObject<Partial<Transaction>>({
            billedAmount: { currency: 'USD', amount: 75 },
            settledAt: expect.any(Date),
          })
          expect(complete?.declineReason).toBeFalsy()

          const refund = result.items.find(
            (t) => t.type === TransactionType.Refund,
          )
          expect(refund).toMatchObject<Partial<Transaction>>({
            billedAmount: { currency: 'USD', amount: 75 },
            settledAt: expect.any(Date),
          })
          expect(refund?.declineReason).toBeFalsy()

          const declined = result.items.find(
            (t) => t.type === TransactionType.Decline,
          )
          expect(declined).toMatchObject<Partial<Transaction>>({
            billedAmount: { currency: 'USD', amount: 50 },
          })
          expect(declined?.declineReason).toBeDefined()
          expect(declined?.settledAt).toBeFalsy()
          // Verify that ensureSignedIn was called (callback should not execute in normal flow)
          // Since user is already signed in during integration tests, callback should not be called
          expect(callbackExecuted).toBe(false)
        })

        it('limits transactions as expected', async () => {
          const result = await instanceUnderTest.listTransactions({
            limit: 1,
          })
          if (result.status !== ListOperationResultStatus.Success) {
            fail('unexpected result')
          }
          expect(result.items).toHaveLength(1)
        })

        it('executes sign-in callback when ensureSignedIn is triggered', async () => {
          let callbackError: Error | undefined
          let callbackInvocations = 0
          const signInDelegate = async () => {
            // Re-sign in the user since we signed them out for this test
            try {
              callbackInvocations++
              await userClient.signInWithKey()
            } catch (error) {
              callbackError = error as Error
              throw error
            }
          }

          // Set up callback to track when it gets executed
          instanceUnderTest.setSignInCallback({
            signIn: signInDelegate,
          })

          // Sign out the user to trigger the callback
          await userClient.globalSignOut()

          try {
            // This should trigger the ensureSignedIn callback
            const result = await instanceUnderTest.listTransactions({})

            // Verify the callback was executed and successful
            expect(callbackInvocations).toBe(1)
            expect(callbackError).toBeUndefined()
            expect(result.status).toBe(ListOperationResultStatus.Success)
          } catch (error) {
            // If test fails, make sure we're signed back in for cleanup
            if (!callbackInvocations) {
              await userClient.signInWithKey()
            }
            throw error
          }
        })
      })
    },
  )
})
