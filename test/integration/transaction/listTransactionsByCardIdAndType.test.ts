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
  SudoVirtualCardsClient,
  Transaction,
  TransactionType,
  VirtualCard,
} from '../../../src'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('ListTransactionsByCardIdAndType Test Suite', () => {
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

    await waitForExpect(async () => {
      const result = await instanceUnderTest.listTransactionsByCardId({
        cardId: card.id,
      })
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

  describe('listTransactionsByCardIdAndType', () => {
    it.each`
      transactionType             | billedAmount
      ${TransactionType.Pending}  | ${{ currency: 'USD', amount: 50 }}
      ${TransactionType.Complete} | ${{ currency: 'USD', amount: 75 }}
      ${TransactionType.Refund}   | ${{ currency: 'USD', amount: 75 }}
      ${TransactionType.Decline}  | ${{ currency: 'USD', amount: 50 }}
    `(
      'returns expected result for $transactionType',
      async ({ transactionType, billedAmount }) => {
        const result = await instanceUnderTest.listTransactionsByCardIdAndType({
          cardId: card.id,
          transactionType,
        })

        if (result.status !== ListOperationResultStatus.Success) {
          fail(`result.status unexpectedly not Success`)
        }
        const transaction = result.items.find((t) => t.type === transactionType)
        expect(transaction).toMatchObject<Partial<Transaction>>({
          billedAmount,
        })
        expect(transaction?.type).toEqual(transactionType)
      },
    )

    it('limits transactions as expected', async () => {
      const result = await instanceUnderTest.listTransactionsByCardIdAndType({
        cardId: card.id,
        transactionType: TransactionType.Pending,
        limit: 1,
      })
      if (result.status !== ListOperationResultStatus.Success) {
        fail('unexpected result')
      }
      expect(result.items).toHaveLength(1)
    })

    it('return empty list for non-existent card', async () => {
      const result = await instanceUnderTest.listTransactionsByCardIdAndType({
        cardId: v4(),
        transactionType: TransactionType.Pending,
        limit: 1,
      })
      if (result.status !== ListOperationResultStatus.Success) {
        fail('unexpected result')
      }
      expect(result.items).toMatchObject([])
    })
  })
})
