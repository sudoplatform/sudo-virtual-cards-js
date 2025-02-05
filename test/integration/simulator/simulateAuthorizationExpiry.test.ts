/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger } from '@sudoplatform/sudo-common'
import { v4 } from 'uuid'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsSimulatorClient } from '../util/virtualCardsSimulatorClientLifecycle'
import {
  SudoVirtualCardsSimulatorClient,
  TransactionNotFoundError,
} from '@sudoplatform/sudo-virtual-cards-simulator'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'
import { VirtualCard } from '../../../src'

describe('SudoVirtualCardsSimulatorClient SimulateAuthorizationExpiry Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

  let instanceUnderTest: SudoVirtualCardsSimulatorClient

  let card: VirtualCard

  beforeAll(async () => {
    const {
      virtualCardsSimulatorClient,
      virtualCardsClient,
      profilesClient,
      sudo,
    } = await setupVirtualCardsSimulatorClient(log)
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = virtualCardsSimulatorClient
    card = await provisionVirtualCard(
      virtualCardsClient,
      profilesClient,
      sudo,
      result.fundingSourceProviders,
    )
  })

  describe('simulateAuthorizationExpiry', () => {
    it('returns expected result', async () => {
      const merchant = await instanceUnderTest.listSimulatorMerchants()
      if (!merchant.length) {
        fail('failed to get merchant')
      }
      const initial = await instanceUnderTest.simulateAuthorization({
        pan: card.pan,
        amount: 50,
        merchantId: merchant[0].id,
        expiry: card.expiry,
        billingAddress: card.billingAddress,
        csc: card.csc,
      })
      await expect(
        instanceUnderTest.simulateAuthorizationExpiry({
          authorizationId: initial.id,
        }),
      ).resolves.toBeDefined()
    })

    it('throws on invalid id', async () => {
      await expect(
        instanceUnderTest.simulateAuthorizationExpiry({
          authorizationId: v4(),
        }),
      ).rejects.toThrow(TransactionNotFoundError)
    })
  })
})
