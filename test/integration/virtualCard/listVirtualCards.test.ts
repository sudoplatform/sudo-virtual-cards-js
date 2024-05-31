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
import {
  SimulatorMerchant,
  SudoVirtualCardsSimulatorClient,
} from '@sudoplatform/sudo-virtual-cards-simulator'
import waitForExpect from 'wait-for-expect'
import {
  SudoVirtualCardsClient,
  Transaction,
  TransactionType,
  VirtualCard,
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
