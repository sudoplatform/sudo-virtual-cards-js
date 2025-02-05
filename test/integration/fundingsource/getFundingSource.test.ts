/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import { v4 } from 'uuid'
import { FundingSourceType, SudoVirtualCardsClient } from '../../../src'
import { createCardFundingSource } from '../util/createFundingSource'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient GetFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

  let instanceUnderTest: SudoVirtualCardsClient
  let fundingSourceProviders: FundingSourceProviders

  describe('GetFundingSource', () => {
    beforeAll(async () => {
      const result = await setupVirtualCardsClient(log)
      instanceUnderTest = result.virtualCardsClient
      fundingSourceProviders = result.fundingSourceProviders
    })

    describe.each`
      provider    | type                            | providerEnabled
      ${'stripe'} | ${FundingSourceType.CreditCard} | ${'stripeCardEnabled'}
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

        it('returns expected result', async () => {
          if (skip) return

          const fundingSource = await createCardFundingSource(
            instanceUnderTest,
            fundingSourceProviders,
            { supportedProviders: [provider] },
          )
          await expect(
            instanceUnderTest.getFundingSource({
              id: fundingSource.id,
              cachePolicy: CachePolicy.RemoteOnly,
            }),
          ).resolves.toStrictEqual(fundingSource)
        })

        it('returns undefined for non-existent funding source', async () => {
          if (skip) return

          await expect(
            instanceUnderTest.getFundingSource({
              id: v4(),
              cachePolicy: CachePolicy.RemoteOnly,
            }),
          ).resolves.toBeUndefined()
        })
      },
    )
  })
})
