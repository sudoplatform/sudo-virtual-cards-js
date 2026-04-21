/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import {
  FundingSource,
  FundingSourceFilterInput,
  FundingSourceState,
  FundingSourceType,
  SortOrder,
  SudoVirtualCardsClient,
} from '../../../src'
import { createCardFundingSource } from '../util/createFundingSource'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'
import { SudoUserClient } from '@sudoplatform/sudo-user'

describe('SudoVirtualCardsClient ListFundingSources Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

  let fundingSources: FundingSource[] = []
  let instanceUnderTest: SudoVirtualCardsClient
  let fundingSourceProviders: FundingSourceProviders
  let userClient: SudoUserClient

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    fundingSourceProviders = result.fundingSourceProviders
    userClient = result.userClient
  })

  afterEach(() => {
    fundingSources = []
  })

  describe('listFundingSources', () => {
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

          // Set up callback to track sign-in guard behavior
          let callbackExecuted = false
          instanceUnderTest.setSignInCallback({
            signIn: async () => {
              callbackExecuted = true
              await Promise.resolve()
            },
          })

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
          const listedFundingSources = result.items
          // default sort order is descending
          for (let i = 1; i < listedFundingSources.length; i++) {
            expect(
              listedFundingSources[i - 1].updatedAt.getTime(),
            ).toBeGreaterThan(listedFundingSources[i].updatedAt.getTime())
          }
          // check ascending sort order
          const ascendingResult = await instanceUnderTest.listFundingSources({
            sortOrder: SortOrder.Asc,
            cachePolicy: CachePolicy.RemoteOnly,
          })
          expect(ascendingResult.items).toHaveLength(fundingSources.length)
          expect(ascendingResult.items).toStrictEqual(
            expect.arrayContaining(fundingSources),
          )
          const ascendingFundingSources = ascendingResult.items
          for (let i = 1; i < listedFundingSources.length; i++) {
            expect(
              ascendingFundingSources[i - 1].updatedAt.getTime(),
            ).toBeLessThan(ascendingFundingSources[i].updatedAt.getTime())
          }
          // Verify that ensureSignedIn was called (callback should not execute in normal flow)
          // Since user is already signed in during integration tests, callback should not be called
          expect(callbackExecuted).toBe(false)
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

        it('returns expected result when filter specified', async () => {
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

          let filter: FundingSourceFilterInput = {
            and: [
              { id: { eq: visaFundingSource.id } },
              { state: { eq: FundingSourceState.Active } },
            ],
          }
          const result1 = await instanceUnderTest.listFundingSources({
            filter,
            cachePolicy: CachePolicy.RemoteOnly,
          })
          expect(result1.items).toHaveLength(1)
          expect(result1.items[0].id).toStrictEqual(visaFundingSource.id)

          filter = {
            or: [
              { id: { eq: mastercardFundingSource.id } },
              { state: { eq: FundingSourceState.Active } },
            ],
          }
          const result2 = await instanceUnderTest.listFundingSources({
            filter,
            cachePolicy: CachePolicy.RemoteOnly,
          })
          expect(result2.items).toHaveLength(2)
          expect(result2.items[0].id).toStrictEqual(mastercardFundingSource.id)

          filter = { state: { eq: FundingSourceState.Inactive } }
          const result3 = await instanceUnderTest.listFundingSources({
            filter,
            cachePolicy: CachePolicy.RemoteOnly,
          })
          expect(result3.items).toEqual([])
        })

        it('executes sign-in callback when ensureSignedIn is triggered', async () => {
          let callbackError: Error | undefined
          let callbackInvocations = 0
          const signInDelegate = async () => {
            // Re-sign in the user since we signed them out for this test
            try {
              callbackInvocations++
              await userClient.signInWithKey()
            } catch (error) {
              callbackError = error as Error
              throw error
            }
          }

          // Set up callback to track when it gets executed
          instanceUnderTest.setSignInCallback({
            signIn: signInDelegate,
          })
          try {
            // Sign out the user to trigger the callback inside CreateCardFundingSource
            await userClient.globalSignOut()

            const visaFundingSource = await createCardFundingSource(
              instanceUnderTest,
              fundingSourceProviders,
              {
                testCard: 'Visa-No3DS-1',
                supportedProviders: [provider],
              },
            )
            fundingSources.push(visaFundingSource)

            // Sign out again the user to trigger the callback inside listFundingSources
            await userClient.globalSignOut()

            // This should trigger the ensureSignedIn callback
            const result = await instanceUnderTest.listFundingSources({
              cachePolicy: CachePolicy.RemoteOnly,
            })

            expect(result.items).toHaveLength(1)
            // Verify the callback was executed and successful
            expect(callbackInvocations).toBe(2)
            expect(callbackError).toBeUndefined()
          } catch (error) {
            // If test fails, make sure we're signed back in for cleanup
            if (!callbackInvocations) {
              await userClient.signInWithKey()
            }
            throw error
          }
        })
      },
    )
  })
})
