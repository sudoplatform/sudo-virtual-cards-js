import Stripe from 'stripe'
import {
  FundingSource,
  FundingSourceType,
  SudoVirtualCardsClient,
} from '../../../src'

/**
 * Funding source test data.
 *
 * Note: All test data taken from https://stripe.com/docs/testing
 */
export const Visa = {
  securityCode: '123',
  creditCardNumber: '4242424242424242',
}
export const Mastercard = {
  securityCode: '123',
  creditCardNumber: '5555555555554444',
}

export const createFundingSource = async (
  virtualCardsClient: SudoVirtualCardsClient,
  stripe: Stripe,
  options?: {
    creditCardNumber?: string
    securityCode?: string
    currency?: string
    type?: FundingSourceType
  },
): Promise<FundingSource> => {
  const provisionalCard = await virtualCardsClient.setupFundingSource({
    currency: 'USD',
    type: FundingSourceType.CreditCard,
  })
  const exp = new Date()
  exp.setUTCFullYear(exp.getUTCFullYear() + 1)
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: {
      // getUTCMonth is indexed at 0, so + 1 is essential.
      exp_month: exp.getUTCMonth() + 1,
      exp_year: exp.getUTCFullYear(),
      number: options?.creditCardNumber ?? '4242424242424242',
      cvc: options?.securityCode ?? '123',
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
  return await virtualCardsClient.completeFundingSource({
    id: provisionalCard.id,
    completionData: {
      provider: 'stripe',
      paymentMethod: setupIntent.payment_method.toString(),
    },
  })
}
