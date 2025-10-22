/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DefaultLogger,
  ListOperationResultStatus,
} from '@sudoplatform/sudo-common'
import {
  FundingSource,
  FundingSourceType,
  ListTransactionsResults,
  SudoVirtualCardsClient,
  Transaction,
  TransactionType,
  VirtualCard,
} from '../../../src'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import {
  createBankAccountFundingSource,
  createCardFundingSource,
} from '../util/createFundingSource'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import { SudoVirtualCardsSimulatorClient } from '@sudoplatform/sudo-virtual-cards-simulator'
import waitForExpect from 'wait-for-expect'
import { runTestsIf } from '../util/runTestsIf'

/**
 * Note that the tests in this suite are not independent. They should be run sequentially
 * as they build upon the state established by previous tests. They are intended to be
 * run against a specific tenant/environment configuration to validate end-to-end functionality.
 */

function runTestsIfSmoketestTenant(name: string, f: () => void) {
  const actualTenant = process.env['TENANT']
  const expectedTenant = process.env['SMOKETEST_TENANT']
  runTestsIf(name, () => !!expectedTenant && actualTenant === expectedTenant, f)
}

runTestsIfSmoketestTenant(
  'SudoVirtualCardsClient External Build Test Suite',
  () => {
    jest.setTimeout(240000)
    const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

    let instanceUnderTest: SudoVirtualCardsClient
    let profilesClient: SudoProfilesClient
    let sudo: Sudo
    let optionalSimulator: SudoVirtualCardsSimulatorClient | undefined
    let fundingSourceProviders: FundingSourceProviders
    const createdFundingSources: FundingSource[] = []
    const createdVirtualCards: VirtualCard[] = []

    beforeAll(async () => {
      const result = await setupVirtualCardsClient(log)
      instanceUnderTest = result.virtualCardsClient
      profilesClient = result.profilesClient
      sudo = result.sudo
      optionalSimulator = result.virtualCardsSimulatorClient!
      fundingSourceProviders = result.fundingSourceProviders
    })

    describe('GetConfigurationData', () => {
      it('returns expected result', async () => {
        const config = await instanceUnderTest.getVirtualCardsConfig()

        expect(config.maxTransactionAmount.length).toBeGreaterThanOrEqual(1)
        expect(config.maxTransactionVelocity.length).toBeGreaterThanOrEqual(1)
        expect(config.virtualCardCurrencies.length).toBeGreaterThanOrEqual(1)
        expect(config.fundingSourceSupportInfo.length).toBeGreaterThanOrEqual(1)
        expect(
          Object.values(config.clientApplicationConfiguration).length,
        ).toBeGreaterThanOrEqual(1)
        expect(config.fundingSourceClientConfiguration).toContainEqual({
          type: 'stripe',
          version: 1,
          fundingSourceType: FundingSourceType.CreditCard,
          apiKey: expect.stringMatching(/^pk_.*/),
        })
      })
    })

    describe('FundingSources', () => {
      it('returns expected result for credit card funding source creation', async () => {
        if (!fundingSourceProviders.stripeCardEnabled) {
          console.log(
            'Credit card funding source not enabled, invalid deployment environment',
          )
          fail()
        }
        const fundingSource = await createCardFundingSource(
          instanceUnderTest,
          fundingSourceProviders,
          { supportedProviders: ['stripe'] },
        )
        expect(fundingSource).toBeDefined()
        createdFundingSources.push(fundingSource)
      })

      it('returns expected result for bank account funding source creation if configured', async () => {
        if (!fundingSourceProviders.checkoutBankAccountEnabled) {
          console.log('Bank account funding source not enabled, skipping test')
          return
        }

        await instanceUnderTest.createKeysIfAbsent()
        const fundingSource = await createBankAccountFundingSource(
          instanceUnderTest,
          {
            username: 'custom_checking_500',
            supportedProviders: ['checkout'],
          },
        )
        expect(fundingSource).toBeDefined()
        createdFundingSources.push(fundingSource)
      })

      it('retrieval of created funding sources succeeds', async () => {
        await Promise.all(
          createdFundingSources.map(async (fs) => {
            const retrieved = await instanceUnderTest.getFundingSource({
              id: fs.id,
            })
            expect(retrieved).toBeDefined()
            expect(retrieved).toEqual(fs)
          }),
        )
      })
    })

    describe('Virtual cards', () => {
      it('listVirtualCards works as expected', async () => {
        const cards = await instanceUnderTest.listVirtualCards()
        expect(cards.status).toBe(ListOperationResultStatus.Success)
        if (cards.status !== ListOperationResultStatus.Failure) {
          expect(cards.items).toBeDefined()
          expect(cards.items).toHaveLength(0)
        }
      })

      it('virtual card creation successful', async () => {
        if (createdFundingSources.length === 0) {
          console.log(
            'No funding sources available, cannot create virtual card',
          )
          fail()
        }
        let expectedCardCount = 1
        const card = await provisionVirtualCard(
          instanceUnderTest,
          profilesClient,
          sudo,
          fundingSourceProviders,
          { fundingSourceId: createdFundingSources[0].id },
        )
        expect(card).toBeDefined()
        createdVirtualCards.push(card)

        if (createdFundingSources.length > 1) {
          const card = await provisionVirtualCard(
            instanceUnderTest,
            profilesClient,
            sudo,
            fundingSourceProviders,
            { fundingSourceId: createdFundingSources[1].id },
          )
          expect(card).toBeDefined()
          createdVirtualCards.push(card)
          ++expectedCardCount
        }
        const cards = await instanceUnderTest.listVirtualCards()
        expect(cards.status).toBe(ListOperationResultStatus.Success)
        if (cards.status !== ListOperationResultStatus.Failure) {
          expect(cards.items).toBeDefined()
          expect(cards.items).toHaveLength(expectedCardCount)
        }
      })
    })

    describe('Transactions', () => {
      it('transaction execution works as expected', async () => {
        if (createdVirtualCards.length === 0) {
          console.log('No virtual cards available, cannot test transactions')
          fail()
        }
        if (!optionalSimulator) {
          console.log(
            'No virtual cards simulator available, cannot test transactions',
          )
          return
        }
        const simulator = optionalSimulator
        const [approvedMerchant, deniedMerchant] = await simulator
          .listSimulatorMerchants()
          .then((merchants) => {
            const approvedMerchant = merchants.find(
              (m) =>
                !m.declineBeforeAuthorization && !m.declineAfterAuthorization,
            )
            const deniedMerchant = merchants.find(
              (m) => m.declineAfterAuthorization,
            )
            return [approvedMerchant, deniedMerchant]
          })
        if (!approvedMerchant || !deniedMerchant) {
          fail('expected merchants not found')
        }
        const firstCard = createdVirtualCards[0]

        await Promise.all([
          simulator.simulateAuthorization({
            pan: firstCard.pan,
            amount: 50,
            merchantId: approvedMerchant.id,
            expiry: firstCard.expiry,
            billingAddress: firstCard.billingAddress,
            csc: firstCard.csc,
          }),
          simulator
            .simulateAuthorization({
              pan: firstCard.pan,
              amount: 75,
              merchantId: approvedMerchant.id,
              expiry: firstCard.expiry,
              billingAddress: firstCard.billingAddress,
              csc: firstCard.csc,
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
            pan: firstCard.pan,
            amount: 50,
            merchantId: deniedMerchant.id,
            expiry: firstCard.expiry,
            billingAddress: firstCard.billingAddress,
            csc: firstCard.csc,
          }),
        ])
        let allTransactions: ListTransactionsResults = {
          status: ListOperationResultStatus.Success,
          items: [],
        }

        await waitForExpect(async () => {
          allTransactions = await instanceUnderTest.listTransactions({})
          if (allTransactions.status !== ListOperationResultStatus.Success) {
            fail(`result.status unexpectedly not Success`)
          }
          expect(allTransactions.items).toHaveLength(4)
          expect(
            allTransactions.items.find(
              (t) => t.type === TransactionType.Complete,
            ),
          ).toBeDefined()
        })
        if (allTransactions.status !== ListOperationResultStatus.Success) {
          fail(`result.status unexpectedly not Success`)
        }
        const pending = allTransactions.items.find(
          (t) => t.type === TransactionType.Pending,
        )
        expect(pending).toMatchObject<Partial<Transaction>>({
          billedAmount: { currency: 'USD', amount: 50 },
        })
        expect(pending?.settledAt).toBeFalsy()
        expect(pending?.declineReason).toBeFalsy()

        const complete = allTransactions.items.find(
          (t) => t.type === TransactionType.Complete,
        )
        expect(complete).toMatchObject<Partial<Transaction>>({
          billedAmount: { currency: 'USD', amount: 75 },
          settledAt: expect.any(Date),
        })
        expect(complete?.declineReason).toBeFalsy()

        const refund = allTransactions.items.find(
          (t) => t.type === TransactionType.Refund,
        )
        expect(refund).toMatchObject<Partial<Transaction>>({
          billedAmount: { currency: 'USD', amount: 75 },
          settledAt: expect.any(Date),
        })
        expect(refund?.declineReason).toBeFalsy()

        const declined = allTransactions.items.find(
          (t) => t.type === TransactionType.Decline,
        )
        expect(declined).toMatchObject<Partial<Transaction>>({
          billedAmount: { currency: 'USD', amount: 50 },
        })
        expect(declined?.declineReason).toBeDefined()
        expect(declined?.settledAt).toBeFalsy()
      })
    })
  },
)
