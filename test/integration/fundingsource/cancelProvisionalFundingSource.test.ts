/*
 * Copyright © 2024 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger } from '@sudoplatform/sudo-common'
import {
  FundingSourceNotFoundError,
  FundingSourceType,
  ProvisionalFundingSourceState,
  SudoVirtualCardsClient,
} from '../../../src'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient CancelProvisionalFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let fundingSourceProviders: FundingSourceProviders

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    fundingSourceProviders = result.fundingSourceProviders
  })

  describe('CancelProvisionalFundingSource', () => {
    describe.each`
      provider      | type                            | providerEnabled
      ${'stripe'}   | ${FundingSourceType.CreditCard} | ${'stripeCardEnabled'}
      ${'checkout'} | ${FundingSourceType.CreditCard} | ${'checkoutCardEnabled'}
    `(
      'for $type provider $provider',
      ({
        provider,
        type,
        providerEnabled,
      }: {
        provider: keyof FundingSourceProviders['apis']
        type: FundingSourceType
        providerEnabled: keyof Omit<FundingSourceProviders, 'apis'>
      }) => {
        let skip = false
        beforeAll(() => {
          // Since we determine availability of provider
          // asynchronously we can't use that knowledge
          // to control the set of providers we iterate
          // over so we have to use a flag
          if (!fundingSourceProviders[providerEnabled]) {
            console.warn(
              `${type} provider ${provider} not enabled. Skipping tests.`,
            )
            skip = true
          }
        })

        it('returns expected failed provisional funding source output', async () => {
          if (skip) return

          const provisionalFundingSource =
            await instanceUnderTest.setupFundingSource({
              currency: 'USD',
              type,
              supportedProviders: [provider],
              applicationName: 'webApplication',
            })

          expect(provisionalFundingSource.state).toEqual(
            ProvisionalFundingSourceState.Provisioning,
          )

          const result = await instanceUnderTest.cancelProvisionalFundingSource(
            provisionalFundingSource.id,
          )
          expect(result.id).toEqual(provisionalFundingSource.id)
          expect(result.state).toEqual(ProvisionalFundingSourceState.Failed)
        })

        it('throws a FundingSourceNotFound error when non-existent funding source is attempted to be cancelled', async () => {
          await expect(
            instanceUnderTest.cancelProvisionalFundingSource('non-existent-id'),
          ).rejects.toThrow(FundingSourceNotFoundError)
        })
      },
    )
  })
})
