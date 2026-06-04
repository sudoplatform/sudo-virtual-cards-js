/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger } from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { v4 } from 'uuid'
import {
  CompleteFundingSourceCompletionDataInput,
  CreditCardNetwork,
  FundingSourceCompletionDataInvalidError,
  FundingSourceNotSetupError,
  FundingSourceState,
  FundingSourceType,
  ProvisionalFundingSourceNotFoundError,
  SudoVirtualCardsClient,
  isStripeCardProvisionalFundingSourceProvisioningData,
} from '../../../src'
import { uuidV4Regex } from '../../utility/uuidV4Regex'
import {
  confirmStripeSetupIntent,
  getTestCard,
} from '../util/createFundingSource'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient CompleteFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let userClient: SudoUserClient
  let fundingSourceProviders: FundingSourceProviders
  let beforeAllComplete = false

  beforeAll(async () => {
    const result = await setupVirtualCardsClient({ log })
    instanceUnderTest = result.virtualCardsClient
    userClient = result.userClient
    fundingSourceProviders = result.fundingSourceProviders

    beforeAllComplete = true
  })

  function expectSetupComplete() {
    expect({ beforeAllComplete }).toEqual({ beforeAllComplete: true })
  }

  const dummyCompletionDataForProvider: Record<
    string,
    CompleteFundingSourceCompletionDataInput
  > = {
    stripe: {
      provider: 'stripe',
      paymentMethod: 'dummyPaymentMethod',
    },
  }

  describe('CompleteFundingSource', () => {
    describe.each`
      provider    | providerEnabled
      ${'stripe'} | ${'stripeCardEnabled'}
    `(
      'for card provider $provider',
      ({
        provider,
        providerEnabled,
      }: {
        provider: keyof FundingSourceProviders['apis']
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
              `Card provider ${provider} not enabled. Skipping tests.`,
            )
            skip = true
          }
        })

        it('returns ProvisionalFundingSourceNotFoundError if invalid id', async () => {
          if (skip) return

          expectSetupComplete()

          await expect(
            instanceUnderTest.completeFundingSource({
              id: v4(),
              completionData: dummyCompletionDataForProvider[provider],
            }),
          ).rejects.toThrow(ProvisionalFundingSourceNotFoundError)
        })

        it('returns FundingSourceCompletionDataInvalidError if invalid completionData', async () => {
          if (skip) return

          expectSetupComplete()

          const provisionalCard = await instanceUnderTest.setupFundingSource({
            currency: 'USD',
            type: FundingSourceType.CreditCard,
            supportedProviders: [provider],
            applicationName: 'system-test-app',
          })

          const card = getTestCard(provider)
          if (
            fundingSourceProviders.apis.stripe &&
            isStripeCardProvisionalFundingSourceProvisioningData(
              provisionalCard.provisioningData,
            )
          ) {
            const stripe = fundingSourceProviders.apis.stripe
            const setupIntent = await confirmStripeSetupIntent(
              stripe,
              card,
              provisionalCard.provisioningData,
            )
            if (!setupIntent.payment_method) {
              throw 'Failed to get payment_method from setup intent'
            }
          } else {
            fail(
              'No API defined for provider or provisioning data does not match known provider',
            )
          }

          await expect(
            instanceUnderTest.completeFundingSource({
              id: provisionalCard.id,
              completionData: dummyCompletionDataForProvider[provider],
            }),
          ).rejects.toThrow(FundingSourceCompletionDataInvalidError)
        })

        it('returns successfully when correct setup data used', async () => {
          if (skip) return

          expectSetupComplete()

          const provisionalCard = await instanceUnderTest.setupFundingSource({
            currency: 'USD',
            type: FundingSourceType.CreditCard,
            supportedProviders: [provider],
            applicationName: 'system-test-app',
          })

          const card = getTestCard(provider)
          let completionData: CompleteFundingSourceCompletionDataInput
          if (
            isStripeCardProvisionalFundingSourceProvisioningData(
              provisionalCard.provisioningData,
            )
          ) {
            const stripe = fundingSourceProviders.apis.stripe
            const setupIntent = await confirmStripeSetupIntent(
              stripe,
              card,
              provisionalCard.provisioningData,
            )
            if (typeof setupIntent.payment_method !== 'string') {
              throw 'Failed to get payment_method from setup intent'
            }
            completionData = {
              provider: 'stripe',
              type: FundingSourceType.CreditCard,
              paymentMethod: setupIntent.payment_method,
            }
          } else {
            fail('unrecognized provisioning data')
          }

          await expect(
            instanceUnderTest.completeFundingSource({
              id: provisionalCard.id,
              completionData,
            }),
          ).resolves.toMatchObject({
            currency: 'USD',
            id: expect.stringMatching(uuidV4Regex('vc-fnd')),
            owner: await userClient.getSubject(),
            version: 1,
            last4: card.last4,
            network: CreditCardNetwork.Visa,
            state: FundingSourceState.Active,
          })
        })
      },
    )

    // Stripe specific tests
    describe('for provider stripe:card', () => {
      let skip = false
      beforeAll(() => {
        // Since we determine availability of provider
        // asynchronously we can't use that knowledge
        // to control the set of providers we iterate
        // over so we have to use a flag
        if (!fundingSourceProviders.apis.stripe) {
          console.warn(`No API available for provider stripe. Skipping tests.`)
          skip = true
        }
      })

      it('returns FundingSourceNotSetupError if setup intent not confirmed', async () => {
        if (skip) return

        expectSetupComplete()

        const provisionalCard = await instanceUnderTest.setupFundingSource({
          currency: 'USD',
          type: FundingSourceType.CreditCard,
          supportedProviders: ['stripe'],
          applicationName: 'system-test-app',
        })

        await expect(
          instanceUnderTest.completeFundingSource({
            id: provisionalCard.id,
            completionData: dummyCompletionDataForProvider.stripe,
          }),
        ).rejects.toThrow(FundingSourceNotSetupError)
      })
    })
  })
})
