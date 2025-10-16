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
  SimulateAuthorizationOutput,
  SudoVirtualCardsSimulatorClient,
  TransactionNotFoundError,
} from '@sudoplatform/sudo-virtual-cards-simulator'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'
import { VirtualCard } from '../../../src'
import { runTestsIfSimulatorAvailable } from '../util/runTestsIf'

runTestsIfSimulatorAvailable(
  'SudoVirtualCardsSimulatorClient SimulateReversal Test Suite',
  () => {
    jest.setTimeout(240000)
    const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

    let instanceUnderTest: SudoVirtualCardsSimulatorClient

    let card: VirtualCard
    let authorizationTransaction: SimulateAuthorizationOutput

    beforeAll(async () => {
      const {
        virtualCardsSimulatorClient,
        virtualCardsClient,
        profilesClient,
        sudo,
      } = await setupVirtualCardsSimulatorClient(log)
      instanceUnderTest = virtualCardsSimulatorClient
      const result = await setupVirtualCardsClient(log)
      card = await provisionVirtualCard(
        virtualCardsClient,
        profilesClient,
        sudo,
        result.fundingSourceProviders,
      )
      const merchant = await instanceUnderTest.listSimulatorMerchants()
      if (!merchant.length) {
        fail('failed to get merchant')
      }
      authorizationTransaction = await instanceUnderTest.simulateAuthorization({
        pan: card.pan,
        amount: 50,
        merchantId: merchant[0].id,
        expiry: card.expiry,
        billingAddress: card.billingAddress,
        csc: card.csc,
      })
    })

    describe('simulateReversal', () => {
      it('returns expected result', async () => {
        await expect(
          instanceUnderTest.simulateReversal({
            authorizationId: authorizationTransaction.id,
            amount: 50,
          }),
        ).resolves.toBeDefined()
      })
      it('throws on invalid id', async () => {
        await expect(
          instanceUnderTest.simulateReversal({
            amount: 50,
            authorizationId: v4(),
          }),
        ).rejects.toThrow(TransactionNotFoundError)
      })
    })
  },
)
