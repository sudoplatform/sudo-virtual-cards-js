import { DefaultLogger } from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import Stripe from 'stripe'
import { v4 } from 'uuid'
import {
  CreditCardNetwork,
  FundingSourceCompletionDataInvalidError,
  FundingSourceNotSetupError,
  FundingSourceState,
  FundingSourceType,
  ProvisionalFundingSourceNotFoundError,
  SudoVirtualCardsClient,
} from '../../../src'
import { uuidV4Regex } from '../../utility/uuidV4Regex'
import { getStripe } from '../util/getStripe'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient CompleteFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let userClient: SudoUserClient
  let stripe: Stripe

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    userClient = result.userClient
    stripe = await getStripe(instanceUnderTest)
  })

  describe('CompleteFundingSource', () => {
    it('returns ProvisionalFundingSourceNotFoundError if invalid id', async () => {
      await expect(
        instanceUnderTest.completeFundingSource({
          id: v4(),
          completionData: {
            provider: 'stripe',
            paymentMethod: 'dummyPaymentMethod',
          },
        }),
      ).rejects.toThrow(ProvisionalFundingSourceNotFoundError)
    })

    it('returns FundingSourceNotSetupError if setup intent not confirmed', async () => {
      const provisionalCard = await instanceUnderTest.setupFundingSource({
        currency: 'USD',
        type: FundingSourceType.CreditCard,
      })

      await expect(
        instanceUnderTest.completeFundingSource({
          id: provisionalCard.id,
          completionData: {
            provider: 'stripe',
            paymentMethod: 'dummyPaymentMethod',
          },
        }),
      ).rejects.toThrow(FundingSourceNotSetupError)
    })

    it('returns FundingSourceCompletionDataInvalidError if invalid completionData', async () => {
      const provisionalCard = await instanceUnderTest.setupFundingSource({
        currency: 'USD',
        type: FundingSourceType.CreditCard,
      })

      const exp = new Date()
      exp.setUTCMonth(exp.getUTCMonth() + 1)
      exp.setUTCFullYear(exp.getUTCFullYear() + 1)
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          exp_month: exp.getUTCMonth(),
          exp_year: exp.getUTCFullYear(),
          number: '4242424242424242',
          cvc: '123',
        },
        billing_details: {
          address: {
            line1: '222333 Peachtree Place',
            city: 'Atlanta',
            country: 'GA',
            postal_code: '30318',
            state: 'US',
          },
        },
      })
      const setupIntent = await stripe.setupIntents.confirm(
        provisionalCard.provisioningData.intent,
        {
          payment_method: paymentMethod.id,
          client_secret: provisionalCard.provisioningData.clientSecret,
        } as Stripe.SetupIntentCreateParams,
      )
      if (!setupIntent.payment_method) {
        throw 'Failed to get payment_method from setup intent'
      }

      await expect(
        instanceUnderTest.completeFundingSource({
          id: provisionalCard.id,
          completionData: {
            provider: 'stripe',
            paymentMethod: 'dummyPaymentMethod',
          },
        }),
      ).rejects.toThrow(FundingSourceCompletionDataInvalidError)
    })

    it('returns successfully when correct setup data used', async () => {
      const provisionalCard = await instanceUnderTest.setupFundingSource({
        currency: 'USD',
        type: FundingSourceType.CreditCard,
      })

      const exp = new Date()
      exp.setUTCMonth(exp.getUTCMonth() + 1)
      exp.setUTCFullYear(exp.getUTCFullYear() + 1)
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          exp_month: exp.getUTCMonth(),
          exp_year: exp.getUTCFullYear(),
          number: '4242424242424242',
          cvc: '123',
        },
        billing_details: {
          address: {
            line1: '222333 Peachtree Place',
            city: 'Atlanta',
            country: 'GA',
            postal_code: '30318',
            state: 'US',
          },
        },
      })
      const setupIntent = await stripe.setupIntents.confirm(
        provisionalCard.provisioningData.intent,
        {
          payment_method: paymentMethod.id,
          client_secret: provisionalCard.provisioningData.clientSecret,
        } as Stripe.SetupIntentCreateParams,
      )
      if (!setupIntent.payment_method) {
        throw 'Failed to get payment_method from setup intent'
      }
      await expect(
        instanceUnderTest.completeFundingSource({
          id: provisionalCard.id,
          completionData: {
            provider: 'stripe',
            paymentMethod: setupIntent.payment_method.toString(),
          },
        }),
      ).resolves.toMatchObject({
        currency: 'USD',
        id: expect.stringMatching(uuidV4Regex('vc-fnd')),
        owner: await userClient.getSubject(),
        version: 1,
        last4: '4242',
        network: CreditCardNetwork.Visa,
        state: FundingSourceState.Active,
      })
    })
  })
})
