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
  ListTransactionsResults,
  SudoVirtualCardsClient,
  Transaction,
  TransactionType,
  VirtualCard,
} from '../../../src'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('ListTransactionsByCardId Test Suite', () => {
  jest.setTimeout(240000)
  waitForExpect.defaults.interval = 250
  waitForExpect.defaults.timeout = 10000

  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let vcSimulator: SudoVirtualCardsSimulatorClient
  let profilesClient: SudoProfilesClient
  let fundingSourceProviders: FundingSourceProviders

  let sudo: Sudo
  let card: VirtualCard

  const setupTransactions = async (): Promise<void> => {
    const [approvedMerchant, deniedMerchant] = await vcSimulator
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
      vcSimulator.simulateAuthorization({
        pan: card.pan,
        amount: 50,
        merchantId: approvedMerchant.id,
        expiry: card.expiry,
        billingAddress: card.billingAddress,
        csc: card.csc,
      }),
      vcSimulator
        .simulateAuthorization({
          pan: card.pan,
          amount: 75,
          merchantId: approvedMerchant.id,
          expiry: card.expiry,
          billingAddress: card.billingAddress,
          csc: card.csc,
        })
        .then((auth) =>
          vcSimulator.simulateDebit({
            amount: 75,
            authorizationId: auth.id,
          }),
        )
        .then((debit) =>
          vcSimulator.simulateRefund({
            amount: 75,
            debitId: debit.id,
          }),
        ),
      vcSimulator.simulateAuthorization({
        pan: card.pan,
        amount: 50,
        merchantId: deniedMerchant.id,
        expiry: card.expiry,
        billingAddress: card.billingAddress,
        csc: card.csc,
      }),
    ])
  }

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    sudo = result.sudo
    fundingSourceProviders = result.fundingSourceProviders
    vcSimulator = result.virtualCardsSimulatorClient

    card = await provisionVirtualCard(
      instanceUnderTest,
      profilesClient,
      sudo,
      fundingSourceProviders,
    )
    await setupTransactions()
  })

  describe('listTransactionsByCardId', () => {
    it('returns expected result', async () => {
      let result: ListTransactionsResults | undefined

      await waitForExpect(async () => {
        result = await instanceUnderTest.listTransactionsByCardId({
          cardId: card.id,
        })
        expect(result.status).toEqual(ListOperationResultStatus.Success)
        if (result.status !== ListOperationResultStatus.Success) {
          fail('unexpected result')
        }
        expect(result.items).toHaveLength(4)
      })
      if (result?.status !== ListOperationResultStatus.Success) {
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

      const refund = result.items.find((t) => t.type === TransactionType.Refund)
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
    })

    it('limits transactions as expected', async () => {
      const result = await instanceUnderTest.listTransactionsByCardId({
        cardId: card.id,
        limit: 1,
      })
      if (result.status !== ListOperationResultStatus.Success) {
        fail('unexpected result')
      }
      expect(result.items).toHaveLength(1)
    })
  })
})
