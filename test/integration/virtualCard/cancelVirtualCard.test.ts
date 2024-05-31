/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import {
  SimulatorMerchant,
  SudoVirtualCardsSimulatorClient,
} from '@sudoplatform/sudo-virtual-cards-simulator'
import { v4 } from 'uuid'
import waitForExpect from 'wait-for-expect'
import {
  APIResultStatus,
  CardNotFoundError,
  CardState,
  SudoVirtualCardsClient,
  Transaction,
  TransactionType,
  VirtualCard,
} from '../../../src'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'
import { runTestsIfSimulatorAvailable } from '../util/runTestsIf'

describe('CancelVirtualCard Test Suite', () => {
  jest.setTimeout(240000)
  waitForExpect.defaults.interval = 250
  waitForExpect.defaults.timeout = 5000

  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let profilesClient: SudoProfilesClient
  let optionalSimulator: SudoVirtualCardsSimulatorClient | undefined
  let sudo: Sudo
  let fundingSourceProviders: FundingSourceProviders
  let card: VirtualCard

  let beforeEachComplete = false

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    optionalSimulator = result.virtualCardsSimulatorClient
    sudo = result.sudo
    fundingSourceProviders = result.fundingSourceProviders

    card = await provisionVirtualCard(
      instanceUnderTest,
      profilesClient,
      sudo,
      fundingSourceProviders,
    )

    beforeEachComplete = true
  })

  function expectSetupComplete(): void {
    expect({ beforeEachComplete }).toEqual({
      beforeEachComplete: true,
    })
  }

  describe('cancelVirtualCard', () => {
    it('returns expected output', async () => {
      expectSetupComplete()

      const result = await instanceUnderTest.cancelVirtualCard({ id: card.id })
      expect(result).toBeDefined()
      expect(result.status).toBe(APIResultStatus.Success)
      expect(result.result).toMatchObject({
        id: card.id,
        state: CardState.Closed,
      })
    })

    it('throws CardNotFoundError for non-existent id', async () => {
      expectSetupComplete()

      await expect(
        instanceUnderTest.cancelVirtualCard({
          id: v4(),
        }),
      ).rejects.toThrow(CardNotFoundError)
    })
  })

  runTestsIfSimulatorAvailable(
    'cancelVirtualCard - if simulator available',
    () => {
      describe('cancelVirtualCard - if simulator available', () => {
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
          expect({ beforeEachComplete, innerBeforeAllComplete }).toEqual({
            beforeEachComplete: true,
            innerBeforeAllComplete: true,
          })
        }

        it('returns expected output with last transaction', async () => {
          expectSetupComplete()

          await expect(
            simulator.simulateAuthorization({
              pan: card.pan,
              amount: 50,
              merchantId: merchant.id,
              expiry: card.expiry,
              billingAddress: card.billingAddress,
              csc: card.csc,
            }),
          ).resolves.toMatchObject({ approved: true })

          let lastTransaction: Transaction | undefined
          await waitForExpect(async () => {
            const gottenCard = await instanceUnderTest.getVirtualCard({
              id: card.id,
              cachePolicy: CachePolicy.RemoteOnly,
            })

            lastTransaction = gottenCard?.lastTransaction
            expect(lastTransaction).toBeDefined()
          })

          expect(lastTransaction).toMatchObject<Partial<Transaction>>({
            billedAmount: { currency: 'USD', amount: 50 },
            transactedAmount: { currency: 'USD', amount: 50 },
            description: merchant.name,
            type: TransactionType.Pending,
          })

          const result = await instanceUnderTest.cancelVirtualCard({
            id: card.id,
          })
          expect(result).toBeDefined()
          expect(result.status).toBe(APIResultStatus.Success)
          expect(result.result).toMatchObject({
            id: card.id,
            state: CardState.Closed,
            lastTransaction,
          })
        })
      })
    },
  )
})
