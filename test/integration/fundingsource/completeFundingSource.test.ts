import { DefaultLogger } from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { v4 } from 'uuid'
import {
  CompleteFundingSourceCompletionDataInput,
  CreditCardNetwork,
  FundingSource,
  FundingSourceCompletionDataInvalidError,
  FundingSourceNotSetupError,
  FundingSourceRequiresUserInteractionError,
  FundingSourceState,
  FundingSourceType,
  isCheckoutCardProvisionalFundingSourceInteractionData,
  isCheckoutCardProvisionalFundingSourceProvisioningData,
  isStripeCardProvisionalFundingSourceProvisioningData,
  ProvisionalFundingSourceNotFoundError,
  SudoVirtualCardsClient,
} from '../../../src'
import { uuidV4Regex } from '../../utility/uuidV4Regex'
import {
  confirmStripeSetupIntent,
  generateCheckoutPaymentToken,
  getTestCard,
} from '../util/createFundingSource'
import { ProviderAPIs } from '../util/getProviderAPIs'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient CompleteFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let userClient: SudoUserClient
  let apis: ProviderAPIs

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    userClient = result.userClient
    apis = result.apis
  })

  const dummyCompletionDataForProvider: Record<
    string,
    CompleteFundingSourceCompletionDataInput
  > = {
    stripe: {
      provider: 'stripe',
      paymentMethod: 'dummyPaymentMethod',
    },
    checkout: {
      provider: 'checkout',
      type: FundingSourceType.CreditCard,
      paymentToken: 'dummyPaymentToken',
    },
  }

  describe('CompleteFundingSource', () => {
    describe.each`
      provider
      ${'stripe'}
      ${'checkout'}
    `(
      'for provider $provider',
      ({ provider }: { provider: keyof ProviderAPIs }) => {
        let skip = false
        beforeAll(() => {
          // Since we determine availability of provider
          // asynchronously we can't use that knowledge
          // to control the set of providers we iterate
          // over so we have to use a flag
          if (!apis[provider]) {
            console.warn(
              `No API available for provider ${provider}. Skipping tests.`,
            )
            skip = true
          }
        })

        it('returns ProvisionalFundingSourceNotFoundError if invalid id', async () => {
          if (skip) return

          await expect(
            instanceUnderTest.completeFundingSource({
              id: v4(),
              completionData: dummyCompletionDataForProvider[provider],
            }),
          ).rejects.toThrow(ProvisionalFundingSourceNotFoundError)
        })

        it('returns FundingSourceCompletionDataInvalidError if invalid completionData', async () => {
          if (skip) return

          const provisionalCard = await instanceUnderTest.setupFundingSource({
            currency: 'USD',
            type: FundingSourceType.CreditCard,
            supportedProviders: [provider],
          })

          const card = getTestCard(provider)
          if (
            apis.stripe &&
            isStripeCardProvisionalFundingSourceProvisioningData(
              provisionalCard.provisioningData,
            )
          ) {
            const stripe = apis.stripe
            const setupIntent = await confirmStripeSetupIntent(
              stripe,
              card,
              provisionalCard.provisioningData,
            )
            if (!setupIntent.payment_method) {
              throw 'Failed to get payment_method from setup intent'
            }
          } else if (
            apis.checkout &&
            isCheckoutCardProvisionalFundingSourceProvisioningData(
              provisionalCard.provisioningData,
            )
          ) {
            await generateCheckoutPaymentToken(
              apis.checkout,
              card,
              provisionalCard.provisioningData,
            )
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

          const provisionalCard = await instanceUnderTest.setupFundingSource({
            currency: 'USD',
            type: FundingSourceType.CreditCard,
            supportedProviders: [provider],
          })

          const card = getTestCard(provider)
          let completionData: CompleteFundingSourceCompletionDataInput
          if (
            isStripeCardProvisionalFundingSourceProvisioningData(
              provisionalCard.provisioningData,
            )
          ) {
            const stripe = apis.stripe
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
          } else if (
            apis.checkout &&
            isCheckoutCardProvisionalFundingSourceProvisioningData(
              provisionalCard.provisioningData,
            )
          ) {
            const paymentToken = await generateCheckoutPaymentToken(
              apis.checkout,
              card,
              provisionalCard.provisioningData,
            )
            completionData = {
              provider: 'checkout',
              type: FundingSourceType.CreditCard,
              paymentToken,
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
    describe('for provider stripe', () => {
      let skip = false
      beforeAll(() => {
        // Since we determine availability of provider
        // asynchronously we can't use that knowledge
        // to control the set of providers we iterate
        // over so we have to use a flag
        if (!apis.stripe) {
          console.warn(`No API available for provider stripe. Skipping tests.`)
          skip = true
        }
      })

      it('returns FundingSourceNotSetupError if setup intent not confirmed', async () => {
        if (skip) return

        const provisionalCard = await instanceUnderTest.setupFundingSource({
          currency: 'USD',
          type: FundingSourceType.CreditCard,
          supportedProviders: ['stripe'],
        })

        await expect(
          instanceUnderTest.completeFundingSource({
            id: provisionalCard.id,
            completionData: dummyCompletionDataForProvider.stripe,
          }),
        ).rejects.toThrow(FundingSourceNotSetupError)
      })
    })

    // Checkout specific tests
    describe('for provider checkout', () => {
      let skip = false
      beforeAll(() => {
        // Since we determine availability of provider
        // asynchronously we can't use that knowledge
        // to control the set of providers we iterate
        // over so we have to use a flag
        if (!apis.checkout) {
          console.warn(
            `No API available for provider checkout. Skipping tests.`,
          )
          skip = true
        }
      })

      it('should throw a valid FundingSourceRequiresUserInteractionError for a card requiring 3DS authentication', async () => {
        if (skip) return

        const provisionalFundingSource =
          await instanceUnderTest.setupFundingSource({
            currency: 'USD',
            type: FundingSourceType.CreditCard,
            supportedProviders: ['checkout'],
          })

        if (
          !apis.checkout ||
          !isCheckoutCardProvisionalFundingSourceProvisioningData(
            provisionalFundingSource.provisioningData,
          )
        ) {
          fail('No checkout provider or provisioning data is not for checkout')
        }

        const card = getTestCard('checkout', 'Visa-3DS2-1')

        const paymentToken = await generateCheckoutPaymentToken(
          apis.checkout,
          card,
          provisionalFundingSource.provisioningData,
        )
        const completionData: CompleteFundingSourceCompletionDataInput = {
          provider: 'checkout',
          type: FundingSourceType.CreditCard,
          paymentToken,
        }

        let caught: Error | undefined
        let completed: FundingSource | undefined
        try {
          completed = await instanceUnderTest.completeFundingSource({
            id: provisionalFundingSource.id,
            completionData,
          })
        } catch (err) {
          caught = err as Error
        }

        expect(completed).toBeUndefined()
        expect(caught).toBeDefined()
        expect(caught).toBeInstanceOf(FundingSourceRequiresUserInteractionError)
        const requiresInteractionError =
          caught as FundingSourceRequiresUserInteractionError
        expect(
          isCheckoutCardProvisionalFundingSourceInteractionData(
            requiresInteractionError.interactionData,
          ),
        ).toEqual(true)
        if (
          !isCheckoutCardProvisionalFundingSourceInteractionData(
            requiresInteractionError.interactionData,
          )
        ) {
          fail(
            'interactionData unexpectedly not for checkout card funding source',
          )
        }
        expect(requiresInteractionError.interactionData).toEqual({
          provider: 'checkout',
          type: FundingSourceType.CreditCard,
          version: 1,
          redirectUrl: expect.stringMatching(/^https:\/\/.*/),
        })
      })
    })
  })
})
