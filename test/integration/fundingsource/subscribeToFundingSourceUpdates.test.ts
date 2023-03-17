import { DefaultLogger } from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { v4 } from 'uuid'
import waitForExpect from 'wait-for-expect'
import {
  CompleteFundingSourceCompletionDataInput,
  CreditCardNetwork,
  FundingSourceState,
  FundingSourceType,
  isCheckoutCardProvisionalFundingSourceProvisioningData,
  isStripeCardProvisionalFundingSourceProvisioningData,
  SudoVirtualCardsClient,
} from '../../../src'
import { FundingSource } from '../../../types'
import { uuidV4Regex } from '../../utility/uuidV4Regex'
import {
  confirmStripeSetupIntent,
  generateCheckoutPaymentToken,
  getTestCard,
} from '../util/createFundingSource'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { IdentityAdminClient } from '../util/identityAdminClient'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient SubscribeToFundingSourceUpdates Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let fundingSourceProviders: FundingSourceProviders
  let userClient: SudoUserClient
  let identityAdminClient: IdentityAdminClient

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    fundingSourceProviders = result.fundingSourceProviders
    userClient = result.userClient
    identityAdminClient = result.identityAdminClient
  })

  describe('SubscribeToFundingSourceUpdates', () => {
    describe.each`
      provider      | providerEnabled
      ${'stripe'}   | ${'stripeCardEnabled'}
      ${'checkout'} | ${'checkoutCardEnabled'}
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
        let subscriptionCalled = false
        let notifiedFundingSourceId: string | undefined = undefined
        let fundingSource: FundingSource | undefined
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
        beforeEach(async () => {
          if (skip) return
          subscriptionCalled = false
          notifiedFundingSourceId = undefined
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
          } else if (
            fundingSourceProviders.apis.checkout &&
            isCheckoutCardProvisionalFundingSourceProvisioningData(
              provisionalCard.provisioningData,
            )
          ) {
            const paymentToken = await generateCheckoutPaymentToken(
              fundingSourceProviders.apis.checkout,
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

          fundingSource = await instanceUnderTest.completeFundingSource({
            id: provisionalCard.id,
            completionData,
          })
          expect(fundingSource).toMatchObject({
            currency: 'USD',
            id: expect.stringMatching(uuidV4Regex('vc-fnd')),
            owner: await userClient.getSubject(),
            version: 1,
            last4: card.last4,
            network: CreditCardNetwork.Visa,
            state: FundingSourceState.Active,
          })
        })

        afterEach(async () => {
          if (fundingSource) {
            await instanceUnderTest.cancelFundingSource(fundingSource.id)
          }
        })

        it('Successfully notifies of funding source update if subscribed', async () => {
          if (skip) return
          const subscriptionId = v4()
          await instanceUnderTest.subscribeToFundingSourceChanges(
            subscriptionId,
            {
              fundingSourceChanged(
                fundingSource: FundingSource,
              ): Promise<void> {
                subscriptionCalled = true
                notifiedFundingSourceId = fundingSource.id
                return Promise.resolve(undefined)
              },
            },
          )

          if (!fundingSource) {
            fail('no funding source was set up')
          }
          const username = await userClient.getUserName()
          if (!username) {
            fail('User is not signed in')
          }
          await identityAdminClient.disableUser({
            input: {
              username,
            },
          })

          await waitForExpect(() => {
            expect(subscriptionCalled).toBeTruthy()
            expect(notifiedFundingSourceId).toEqual(fundingSource?.id)
          })

          await identityAdminClient.enableUser({
            input: {
              username,
            },
          })
        })

        it('Does not notify of funding source update if not subscribed', async () => {
          if (skip) return
          const subscriptionId = v4()
          await instanceUnderTest.subscribeToFundingSourceChanges(
            subscriptionId,
            {
              fundingSourceChanged(
                fundingSource: FundingSource,
              ): Promise<void> {
                subscriptionCalled = true
                notifiedFundingSourceId = fundingSource.id
                return Promise.resolve(undefined)
              },
            },
          )

          if (!fundingSource) {
            fail('no funding source was set up')
          }

          instanceUnderTest.unsubscribeFromFundingSourceChanges(subscriptionId)

          const username = await userClient.getUserName()
          if (!username) {
            fail('User is not signed in')
          }
          await identityAdminClient.disableUser({
            input: {
              username,
            },
          })

          await waitForExpect(() => {
            expect(subscriptionCalled).toBeFalsy()
            expect(notifiedFundingSourceId).toBeUndefined()
          })

          await identityAdminClient.enableUser({
            input: {
              username,
            },
          })
        })
      },
    )
  })
})
