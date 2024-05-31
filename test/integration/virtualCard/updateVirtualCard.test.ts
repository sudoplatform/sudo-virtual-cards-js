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
  SudoVirtualCardsClient,
  Transaction,
  TransactionType,
  VirtualCard,
} from '../../../src'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'
import { runTestsIfSimulatorAvailable } from '../util/runTestsIf'

describe('UpdateVirtualCard Test Suite', () => {
  jest.setTimeout(240000)
  waitForExpect.defaults.interval = 250
  waitForExpect.defaults.timeout = 5000

  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let profilesClient: SudoProfilesClient
  let optionalSimulator: SudoVirtualCardsSimulatorClient | undefined
  let sudo: Sudo
  let fundingSourceProviders: FundingSourceProviders
  let fundingSourceId: string | undefined = undefined
  let card: VirtualCard
  let cardToCancel: VirtualCard | undefined

  let beforeAllComplete = false
  let beforeEachComplete = false

  function expectSetupComplete(): void {
    expect({
      beforeAllComplete,
      beforeEachComplete,
    }).toEqual({
      beforeAllComplete: true,
      beforeEachComplete: true,
    })
  }

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    optionalSimulator = result.virtualCardsSimulatorClient
    sudo = result.sudo
    fundingSourceProviders = result.fundingSourceProviders

    beforeAllComplete = true
  })

  beforeEach(async () => {
    card = await provisionVirtualCard(
      instanceUnderTest,
      profilesClient,
      sudo,
      fundingSourceProviders,
      { fundingSourceId },
    )
    cardToCancel = card
    fundingSourceId = card.fundingSourceId
    beforeEachComplete = true
  })

  afterEach(async () => {
    beforeEachComplete = false
    if (cardToCancel) {
      const cardToCancelId = cardToCancel.id
      cardToCancel = undefined
      await instanceUnderTest
        .cancelVirtualCard({ id: cardToCancelId })
        .catch((err) =>
          log.error(`Cannot cancel card ${cardToCancelId}: ${err.message}`),
        )
    }
  })

  describe('updateVirtualCard', () => {
    it('returns expected output', async () => {
      expectSetupComplete()

      const result = await instanceUnderTest.updateVirtualCard({
        id: card.id,
        expectedCardVersion: card.version,
        cardHolder: 'newCardHolder',
        alias: 'newAlias',
        billingAddress: card.billingAddress,
      })
      expect(result).toBeDefined()
      expect(result.status).toBe(APIResultStatus.Success)
      expect(result.result).toMatchObject({
        id: card.id,
        cardHolder: 'newCardHolder',
        alias: 'newAlias',
        billingAddress: card.billingAddress,
      })
    })

    it('throws CardNotFoundError for non-existent id', async () => {
      expectSetupComplete()

      await expect(
        instanceUnderTest.updateVirtualCard({
          id: v4(),
          cardHolder: 'newCardHolder',
          alias: 'newAlias',
          billingAddress: undefined,
        }),
      ).rejects.toThrow(CardNotFoundError)
    })

    it('can clear billing address by updating to null while leaving other properties unchanged', async () => {
      expectSetupComplete()

      const update = await instanceUnderTest.updateVirtualCard({
        id: card.id,
        billingAddress: null,
      })
      expect(update.status).toEqual(APIResultStatus.Success)
      if (update.status !== APIResultStatus.Success) {
        fail('update status unexpectedly unsuccessful')
      }
      const updated = update.result

      // Billing address may either be undefined or empty string
      // depending on environment
      expect([undefined, '']).toContainEqual(updated.billingAddress)

      // updatedAt and version should be updated but all other properties should be unchanged
      expect(updated).toEqual({
        ...card,
        updatedAt: updated.updatedAt,
        version: updated.version,
        billingAddress: updated.billingAddress,
      })
    })

    it('can clear metadata by updating to null while leaving other properties unchanged', async () => {
      expectSetupComplete()

      const update = await instanceUnderTest.updateVirtualCard({
        id: card.id,
        metadata: null,
      })
      expect(update.status).toEqual(APIResultStatus.Success)
      if (update.status !== APIResultStatus.Success) {
        fail('update status unexpectedly unsuccessful')
      }
      const updated = update.result
      expect(updated).toEqual({
        ...card,
        updatedAt: updated.updatedAt,
        version: updated.version,
        metadata: undefined,
      })
    })
  })

  runTestsIfSimulatorAvailable(
    'updateVirtualCard - if simulator available',
    () => {
      describe('updateVirtualCard - if simulator available', () => {
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
            beforeAllComplete,
            innerBeforeAllComplete,
          }).toEqual({
            beforeAllComplete: true,
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

          const result = await instanceUnderTest.updateVirtualCard({
            id: card.id,
            expectedCardVersion: card.version,
            cardHolder: 'newCardHolder',
            alias: 'newAlias',
            billingAddress: card.billingAddress,
          })
          expect(result).toBeDefined()
          expect(result.status).toBe(APIResultStatus.Success)
          expect(result.result).toMatchObject({
            id: card.id,
            cardHolder: 'newCardHolder',
            alias: 'newAlias',
            billingAddress: card.billingAddress,
            lastTransaction,
          })
        })
      })
    },
  )
})
