/*
 * Copyright © 2024 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import {
  FundingSourceType,
  ProvisionalFundingSource,
  ProvisionalFundingSourceFilterInput,
  ProvisionalFundingSourceState,
  SortOrder,
  SudoVirtualCardsClient,
} from '../../../src'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient ListProvisionalFundingSources Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

  let provisionalFundingSources: ProvisionalFundingSource[] = []
  let instanceUnderTest: SudoVirtualCardsClient
  let fundingSourceProviders: FundingSourceProviders

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    fundingSourceProviders = result.fundingSourceProviders
  })

  afterEach(() => {
    provisionalFundingSources = []
  })

  describe('listProvisionalFundingSources', () => {
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

          const provisionalFundingSource1 =
            await instanceUnderTest.setupFundingSource({
              currency: 'USD',
              type: FundingSourceType.CreditCard,
              supportedProviders: [provider],
              applicationName: 'webApplication',
            })

          const provisionalFundingSource2 =
            await instanceUnderTest.setupFundingSource({
              currency: 'USD',
              type: FundingSourceType.CreditCard,
              supportedProviders: [provider],
              applicationName: 'webApplication',
            })

          provisionalFundingSources.push(provisionalFundingSource1)
          provisionalFundingSources.push(provisionalFundingSource2)
          const result = await instanceUnderTest.listProvisionalFundingSources({
            cachePolicy: CachePolicy.RemoteOnly,
          })
          expect(result.items).toHaveLength(provisionalFundingSources.length)
          expect(result.items).toStrictEqual(
            expect.arrayContaining(provisionalFundingSources),
          )
          const listedProvisionalFundingSources = result.items
          // default sort order is descending
          for (let i = 1; i < listedProvisionalFundingSources.length; i++) {
            expect(
              listedProvisionalFundingSources[i - 1].updatedAt.getTime(),
            ).toBeGreaterThan(
              listedProvisionalFundingSources[i].updatedAt.getTime(),
            )
          }
          // check ascending sort order
          const ascendingResult =
            await instanceUnderTest.listProvisionalFundingSources({
              sortOrder: SortOrder.Asc,
              cachePolicy: CachePolicy.RemoteOnly,
            })
          expect(ascendingResult.items).toHaveLength(
            provisionalFundingSources.length,
          )
          expect(ascendingResult.items).toStrictEqual(
            expect.arrayContaining(provisionalFundingSources),
          )
          const ascendingProvisionalFundingSources = ascendingResult.items
          for (let i = 1; i < listedProvisionalFundingSources.length; i++) {
            expect(
              ascendingProvisionalFundingSources[i - 1].updatedAt.getTime(),
            ).toBeLessThan(
              ascendingProvisionalFundingSources[i].updatedAt.getTime(),
            )
          }
        })

        it('returns empty list result for no matching funding sources', async () => {
          const result = await instanceUnderTest.listProvisionalFundingSources({
            cachePolicy: CachePolicy.RemoteOnly,
          })
          expect(result.items).toEqual([])
        })

        it('returns expected result when limit specified', async () => {
          if (skip) return

          const pfs1 = await instanceUnderTest.setupFundingSource({
            currency: 'USD',
            type: FundingSourceType.CreditCard,
            supportedProviders: [provider],
            applicationName: 'webApplication',
          })
          const pfs2 = await instanceUnderTest.setupFundingSource({
            currency: 'USD',
            type: FundingSourceType.CreditCard,
            supportedProviders: [provider],
            applicationName: 'webApplication',
          })

          const result1 = await instanceUnderTest.listProvisionalFundingSources(
            {
              cachePolicy: CachePolicy.RemoteOnly,
              limit: 1,
            },
          )
          expect(result1.items).toHaveLength(1)
          expect(result1.nextToken).toBeTruthy()
          expect([pfs1, pfs2]).toContainEqual(result1.items[0])

          const result2 = await instanceUnderTest.listProvisionalFundingSources(
            {
              cachePolicy: CachePolicy.RemoteOnly,
              limit: 1,
              nextToken: result1.nextToken,
            },
          )
          expect(result2.items).toHaveLength(1)
          expect(result2.nextToken).toBeUndefined()
          expect([pfs1, pfs2]).toContainEqual(result2.items[0])

          expect(result1.items[0]).not.toEqual(result2.items[0])
        })

        it('returns expected result when filter specified', async () => {
          if (skip) return

          const pfs1 = await instanceUnderTest.setupFundingSource({
            currency: 'USD',
            type: FundingSourceType.CreditCard,
            supportedProviders: [provider],
            applicationName: 'webApplication',
          })
          const pfs2 = await instanceUnderTest.setupFundingSource({
            currency: 'USD',
            type: FundingSourceType.CreditCard,
            supportedProviders: [provider],
            applicationName: 'webApplication',
          })

          let filter: ProvisionalFundingSourceFilterInput = {
            and: [
              { id: { eq: pfs1.id } },
              { state: { eq: ProvisionalFundingSourceState.Provisioning } },
            ],
          }
          const result1 = await instanceUnderTest.listProvisionalFundingSources(
            {
              filter,
              cachePolicy: CachePolicy.RemoteOnly,
            },
          )
          expect(result1.items).toHaveLength(1)
          expect(result1.items[0].id).toStrictEqual(pfs1.id)

          filter = {
            or: [
              { id: { eq: pfs2.id } },
              { state: { eq: ProvisionalFundingSourceState.Completed } },
            ],
          }
          const result2 = await instanceUnderTest.listProvisionalFundingSources(
            {
              filter,
              cachePolicy: CachePolicy.RemoteOnly,
            },
          )
          expect(result2.items).toHaveLength(1)
          expect(result2.items[0].id).toStrictEqual(pfs2.id)

          filter = { state: { eq: ProvisionalFundingSourceState.Completed } }
          const result3 = await instanceUnderTest.listProvisionalFundingSources(
            {
              filter,
              cachePolicy: CachePolicy.RemoteOnly,
            },
          )
          expect(result3.items).toEqual([])
        })
      },
    )
  })
})
