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
import { v4 } from 'uuid'
import waitForExpect from 'wait-for-expect'
import {
  ListTransactionsResults,
  SudoVirtualCardsClient,
  Transaction,
  VirtualCard,
} from '../../../src'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'
import { runTestsIfSimulatorAvailable } from '../util/runTestsIf'

describe('GetTransaction Test Suite', () => {
  jest.setTimeout(240000)
  waitForExpect.defaults.interval = 250
  waitForExpect.defaults.timeout = 10000

  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let optionalSimulator: SudoVirtualCardsSimulatorClient | undefined
  let profilesClient: SudoProfilesClient
  let fundingSourceProviders: FundingSourceProviders

  let sudo: Sudo

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    sudo = result.sudo
    fundingSourceProviders = result.fundingSourceProviders
    optionalSimulator = result.virtualCardsSimulatorClient!
  })

  describe('getTransaction', () => {
    it('should return undefined if transaction does not exist', async () => {
      await expect(
        instanceUnderTest.getTransaction({ id: v4() }),
      ).resolves.toBeUndefined()
    })
  })

  runTestsIfSimulatorAvailable(
    'getTransaction - if simulator available',
    () => {
      describe('getTransaction - if simulator available', () => {
        let simulator: SudoVirtualCardsSimulatorClient
        let card: VirtualCard
        let authorization: Transaction

        beforeEach(async () => {
          simulator = optionalSimulator!

          card = await provisionVirtualCard(
            instanceUnderTest,
            profilesClient,
            sudo,
            fundingSourceProviders,
          )

          const merchant = (await simulator.listSimulatorMerchants())[0]
          await simulator.simulateAuthorization({
            pan: card.pan,
            amount: 50,
            merchantId: merchant.id,
            expiry: card.expiry,
            billingAddress: card.billingAddress,
            csc: card.csc,
          })

          let authorizationResult: ListTransactionsResults | undefined
          await waitForExpect(async () => {
            authorizationResult =
              await instanceUnderTest.listTransactionsByCardId({
                cardId: card.id,
              })
            if (
              authorizationResult.status !== ListOperationResultStatus.Success
            ) {
              fail('failed to get successful transactions')
            }
            expect(authorizationResult.items).toHaveLength(1)
          })

          if (
            authorizationResult?.status !== ListOperationResultStatus.Success
          ) {
            fail('transaction result unexpectedly falsy')
          }
          authorization = authorizationResult.items[0]
        })

        it('returns expected result for an authorization', async () => {
          const result = await instanceUnderTest.getTransaction({
            id: authorization.id,
          })
          expect(result).toStrictEqual(authorization)
        })

        it('returns undefined for non-existent transaction', async () => {
          await expect(
            instanceUnderTest.getTransaction({
              id: v4(),
            }),
          ).resolves.toBeUndefined()
        })
      })
    },
  )
})
