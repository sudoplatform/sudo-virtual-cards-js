/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import {
  FundingSource,
  FundingSourceType,
  SudoVirtualCardsClient,
} from '../../../src'
import { createCardFundingSource } from '../util/createFundingSource'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient ListFundingSources Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

  let fundingSources: FundingSource[] = []
  let instanceUnderTest: SudoVirtualCardsClient
  let fundingSourceProviders: FundingSourceProviders

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    fundingSourceProviders = result.fundingSourceProviders
  })

  afterEach(() => {
    fundingSources = []
  })

  describe('listFundingSources', () => {
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
        beforeEach(() => {
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

          const visaFundingSource = await createCardFundingSource(
            instanceUnderTest,
            fundingSourceProviders,
            {
              testCard: 'Visa-No3DS-1',
              supportedProviders: [provider],
            },
          )
          const mastercardFundingSource = await createCardFundingSource(
            instanceUnderTest,
            fundingSourceProviders,
            {
              testCard: 'MC-No3DS-1',
              supportedProviders: [provider],
            },
          )
          fundingSources.push(visaFundingSource)
          fundingSources.push(mastercardFundingSource)
          const result = await instanceUnderTest.listFundingSources({
            cachePolicy: CachePolicy.RemoteOnly,
          })
          expect(result.items).toHaveLength(fundingSources.length)
          expect(result.items).toStrictEqual(
            expect.arrayContaining(fundingSources),
          )
        })

        it('returns empty list result for no matching funding sources', async () => {
          const result = await instanceUnderTest.listFundingSources({
            cachePolicy: CachePolicy.RemoteOnly,
          })
          expect(result.items).toEqual([])
        })

        it('returns expected result when limit specified', async () => {
          if (skip) return

          const fs1 = await createCardFundingSource(
            instanceUnderTest,
            fundingSourceProviders,
            {
              testCard: 'Visa-No3DS-1',
              supportedProviders: [provider],
            },
          )
          const fs2 = await createCardFundingSource(
            instanceUnderTest,
            fundingSourceProviders,
            {
              testCard: 'MC-No3DS-1',
              supportedProviders: [provider],
            },
          )

          const result = await instanceUnderTest.listFundingSources({
            cachePolicy: CachePolicy.RemoteOnly,
            limit: 1,
          })
          expect(result.items).toHaveLength(1)
          expect(result.nextToken).toBeTruthy()
          expect([fs1, fs2]).toContainEqual(result.items[0])

          const result2 = await instanceUnderTest.listFundingSources({
            cachePolicy: CachePolicy.RemoteOnly,
            limit: 1,
            nextToken: result.nextToken,
          })
          expect(result2.items).toHaveLength(1)
          expect(result2.nextToken).toBeUndefined()
          expect([fs1, fs2]).toContainEqual(result2.items[0])

          expect(result.items[0]).not.toEqual(result2.items[0])
        })
      },
    )
  })
})
