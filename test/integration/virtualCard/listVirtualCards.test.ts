/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CachePolicy,
  DefaultLogger,
  ListOperationResultStatus,
} from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import {
  SimulatorMerchant,
  SudoVirtualCardsSimulatorClient,
} from '@sudoplatform/sudo-virtual-cards-simulator'
import waitForExpect from 'wait-for-expect'
import {
  SortOrder,
  SudoVirtualCardsClient,
  Transaction,
  TransactionType,
  VirtualCard,
  VirtualCardFilterInput,
} from '../../../src'
import { createCardFundingSource } from '../util/createFundingSource'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'
import { runTestsIfSimulatorAvailable } from '../util/runTestsIf'

describe('ListVirtualCards Test Suite', () => {
  jest.setTimeout(240000)
  waitForExpect.defaults.interval = 250
  waitForExpect.defaults.timeout = 5000

  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let profilesClient: SudoProfilesClient
  let optionalSimulator: SudoVirtualCardsSimulatorClient | undefined
  let sudo: Sudo
  let fundingSourceProviders: FundingSourceProviders
  const cards: VirtualCard[] = []
  let beforeAllComplete = false

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    optionalSimulator = result.virtualCardsSimulatorClient
    sudo = result.sudo
    fundingSourceProviders = result.fundingSourceProviders

    const fundingSource = await createCardFundingSource(
      instanceUnderTest,
      fundingSourceProviders,
    )
    const provisionCardFn = async (): Promise<VirtualCard> => {
      return await provisionVirtualCard(
        instanceUnderTest,
        profilesClient,
        sudo,
        fundingSourceProviders,
        {
          fundingSourceId: fundingSource.id,
        },
      )
    }

    // Create 5 cards
    // To avoid race condition, create one card first
    cards.push(await provisionCardFn())
    const created = await Promise.all([
      provisionCardFn(),
      provisionCardFn(),
      provisionCardFn(),
      provisionCardFn(),
    ])
    cards.push(...created)
    expect(cards).toHaveLength(5)

    beforeAllComplete = true
  })

  describe('listVirtualCards', () => {
    function expectSetupComplete(): void {
      expect({
        beforeAllComplete,
      }).toEqual({
        beforeAllComplete: true,
      })
    }

    it('returns expected output', async () => {
      expectSetupComplete()

      const result = await instanceUnderTest.listVirtualCards()
      if (result.status !== ListOperationResultStatus.Success) {
        fail(`Wrong status: ${result.status}`)
      }
      expect(result.items).toHaveLength(5)
      expect(result).toStrictEqual<typeof result>({
        status: ListOperationResultStatus.Success,
        items: expect.arrayContaining(cards),
        nextToken: undefined,
      })
      const listedCards = result.items
      // default sort order is descending
      for (let i = 1; i < listedCards.length; i++) {
        expect(listedCards[i - 1].updatedAt.getTime()).toBeGreaterThan(
          listedCards[i].updatedAt.getTime(),
        )
      }
      // check ascending sort order
      const ascendingResult = await instanceUnderTest.listVirtualCards({
        sortOrder: SortOrder.Asc,
        cachePolicy: CachePolicy.RemoteOnly,
      })
      if (ascendingResult.status !== ListOperationResultStatus.Success) {
        fail(`Wrong status: ${ascendingResult.status}`)
      }
      expect(ascendingResult.items).toHaveLength(cards.length)
      expect(ascendingResult.items).toStrictEqual(expect.arrayContaining(cards))
      const ascendingCards = ascendingResult.items
      for (let i = 1; i < listedCards.length; i++) {
        expect(ascendingCards[i - 1].updatedAt.getTime()).toBeLessThan(
          ascendingCards[i].updatedAt.getTime(),
        )
      }
    })

    it('limits cards as expected', async () => {
      expectSetupComplete()

      const result = await instanceUnderTest.listVirtualCards({ limit: 1 })
      if (result.status !== ListOperationResultStatus.Success) {
        fail(`Wrong status: ${result.status}`)
      }
      expect(result.items).toHaveLength(1)
    })

    it('respects pagination', async () => {
      expectSetupComplete()

      const cardResult: VirtualCard[] = []
      let calls = 0
      do {
        calls++
        const result = await instanceUnderTest.listVirtualCards({
          limit: 1,
        })
        if (result.status !== ListOperationResultStatus.Success) {
          fail(`Wrong status: ${result.status}`)
        }
        cardResult.push(...result.items)
      } while (calls < 5)
      expect(calls).toEqual(5)
      expect(cardResult).toHaveLength(5)
    })

    it('returns expected result when filter specified', async () => {
      // sort our saved cards in the default order returned by listVirtualCards, ie,
      // descending by updatedAt
      cards.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      let filter: VirtualCardFilterInput = {
        and: [{ id: { eq: cards[0].id } }, { state: { eq: 'ISSUED' } }],
      }
      const result1 = await instanceUnderTest.listVirtualCards({
        filter,
        cachePolicy: CachePolicy.RemoteOnly,
      })
      if (result1.status !== ListOperationResultStatus.Success) {
        fail(`Wrong status: ${result1.status}`)
      }
      expect(result1.items).toHaveLength(1)
      expect(result1.items[0].id).toStrictEqual(cards[0].id)

      filter = {
        or: [{ id: { eq: cards[0].id } }, { state: { eq: 'ISSUED' } }],
      }
      const result2 = await instanceUnderTest.listVirtualCards({
        filter,
        cachePolicy: CachePolicy.RemoteOnly,
      })
      if (result2.status !== ListOperationResultStatus.Success) {
        fail(`Wrong status: ${result2.status}`)
      }
      expect(result2.items).toHaveLength(5)
      expect(result2.items[0].id).toStrictEqual(cards[0].id)

      filter = { state: { eq: 'FAILED' } }
      const result3 = await instanceUnderTest.listVirtualCards({
        filter,
        cachePolicy: CachePolicy.RemoteOnly,
      })
      if (result3.status !== ListOperationResultStatus.Success) {
        fail(`Wrong status: ${result3.status}`)
      }
      expect(result3.items).toEqual([])
    })
  })

  runTestsIfSimulatorAvailable(
    'listVirtualCards - if simulator available',
    () => {
      describe('listVirtualCards - if simulator available', () => {
        let simulator: SudoVirtualCardsSimulatorClient
        let merchant: SimulatorMerchant

        let innerBeforeAllComplete = false

        beforeAll(async () => {
          simulator = optionalSimulator!
          const merchants = await simulator.listSimulatorMerchants()

          const usdApprovingMerchant = merchants.find(
            (m) =>
              m.currency === 'USD' &&
              !m.declineAfterAuthorization &&
              !m.declineBeforeAuthorization,
          )
          if (!usdApprovingMerchant) {
            fail('Could not find a USD approving simulator merchant')
          }
          merchant = usdApprovingMerchant

          innerBeforeAllComplete = true
        })

        function expectSetupComplete(): void {
          expect({
            beforeEachComplete: beforeAllComplete,
            innerBeforeAllComplete,
          }).toEqual({
            beforeEachComplete: true,
            innerBeforeAllComplete: true,
          })
        }
        it('includes last transaction information', async () => {
          expectSetupComplete()

          const approvalResults = await Promise.all(
            cards.map((card) =>
              simulator.simulateAuthorization({
                pan: card.pan,
                amount: 50,
                merchantId: merchant.id,
                expiry: card.expiry,
                billingAddress: card.billingAddress,
                csc: card.csc,
              }),
            ),
          )

          approvalResults.forEach((result, index) => {
            expect({
              approved: result.approved,
              declineReason: result.declineReason,
              index,
              cardId: cards[index].id,
            }).toEqual({
              approved: true,
              declineReason: undefined,
              index,
              cardId: cards[index].id,
            })
          })

          await waitForExpect(async () => {
            const result = await instanceUnderTest.listVirtualCards()
            if (result.status !== ListOperationResultStatus.Success) {
              fail(`Wrong status: ${result.status}`)
            }

            expect(result.items).toHaveLength(5)
            result.items.forEach((item) => {
              expect(item.lastTransaction).toMatchObject<Partial<Transaction>>({
                billedAmount: { currency: 'USD', amount: 50 },
                transactedAmount: { currency: 'USD', amount: 50 },
                description: merchant.name,
                type: TransactionType.Pending,
              })
            })
          })
        })
      })
    },
  )
})
