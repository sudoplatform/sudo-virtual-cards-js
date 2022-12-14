import { Checkout } from 'checkout-sdk-node'
import Stripe from 'stripe'
import {
  CardType,
  CheckoutCardProvisionalFundingSourceProvisioningData,
  CompleteFundingSourceCompletionDataInput,
  CreditCardFundingSource,
  FundingSource,
  FundingSourceType,
  isCheckoutCardProvisionalFundingSourceProvisioningData,
  isStripeCardProvisionalFundingSourceProvisioningData,
  StripeCardProvisionalFundingSourceProvisioningData,
  SudoVirtualCardsClient,
} from '../../../src'
import { ProviderAPIs } from './getProviderAPIs'

export const CardProviderNames = ['stripe', 'checkout'] as const

export type CardProviderName = typeof CardProviderNames[number]
export function isCardProviderName(s: string): s is CardProviderName {
  return (CardProviderNames as readonly string[]).includes(s)
}

export interface TestCardBillingAddressProperties {
  addressLine1: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export class TestCardBillingAddress {
  public readonly addressLine1: string
  public readonly addressLine2?: string
  public readonly city: string
  public readonly state: string
  public readonly postalCode: string
  public readonly country: string

  public constructor({
    addressLine1,
    addressLine2 = undefined,
    city = 'Atlanta',
    state = 'GA',
    postalCode = '30318',
    country = 'US',
  }: TestCardBillingAddressProperties) {
    this.addressLine1 = addressLine1
    this.addressLine2 = addressLine2
    this.city = city
    this.state = state
    this.postalCode = postalCode
    this.country = country
  }
}

export const DefaultTestCardBillingAddress: Record<
  CardProviderName,
  TestCardBillingAddress
> = {
  stripe: new TestCardBillingAddress({
    addressLine1: '222333 Peachtree Place',
  }),
  checkout: new TestCardBillingAddress({ addressLine1: 'Test_Y' }),
}

export const TestCardNames = [
  'Visa-3DS2-1',
  'Visa-3DS2-2',
  'Visa-No3DS-1',
  'MC-No3DS-1',
  'BadAddress',
] as const
export type TestCardName = typeof TestCardNames[number]

export type TestCard = {
  number: string
  cvv: string
  last4: string
  cardType: CardType
  address: TestCardBillingAddress
}

/**
 * Checkout funding source test data.
 *
 * Note: All test data taken from https://www.checkout.com/docs/testing/test-cards
 */
export const CheckoutTestCards: Record<TestCardName, TestCard | undefined> = {
  'Visa-3DS2-1': {
    number: '4242424242424242',
    cvv: '100',
    last4: '4242',
    address: DefaultTestCardBillingAddress['checkout'],
    cardType: CardType.Credit,
  },
  'Visa-3DS2-2': {
    number: '4543474002249996',
    cvv: '956',
    last4: '9996',
    address: DefaultTestCardBillingAddress['checkout'],
    cardType: CardType.Credit,
  },
  'Visa-No3DS-1': {
    number: '4532432452900131',
    cvv: '257',
    last4: '0131',
    address: DefaultTestCardBillingAddress['checkout'],
    cardType: CardType.Credit,
  },
  'MC-No3DS-1': {
    number: '5352151570003404',
    cvv: '100',
    last4: '3404',
    address: DefaultTestCardBillingAddress['checkout'],
    cardType: CardType.Debit,
  },
  BadAddress: {
    number: '4532432452900131',
    cvv: '257',
    last4: '0131',
    // See https://www.checkout.com/docs/testing/avs-check-testing
    address: new TestCardBillingAddress({ addressLine1: 'Test_N' }),
    cardType: CardType.Credit,
  },
}

/**
 * Stripe funding source test data.
 *
 * Note: All test data taken from https://stripe.com/docs/testing
 */
export const StripeTestCards: Record<TestCardName, TestCard | undefined> = {
  'Visa-3DS2-1': {
    number: '4000000000003220',
    cvv: '123',
    last4: '3220',
    address: DefaultTestCardBillingAddress['stripe'],
    cardType: CardType.Credit,
  },
  'Visa-3DS2-2': undefined,
  'Visa-No3DS-1': {
    number: '4242424242424242',
    cvv: '123',
    last4: '4242',
    address: DefaultTestCardBillingAddress['stripe'],
    cardType: CardType.Credit,
  },
  'MC-No3DS-1': {
    number: '5555555555554444',
    cvv: '123',
    last4: '4444',
    address: DefaultTestCardBillingAddress['stripe'],
    cardType: CardType.Credit,
  },
  BadAddress: {
    number: '4000000000000010',
    cvv: '123',
    last4: '0010',
    address: DefaultTestCardBillingAddress['stripe'],
    cardType: CardType.Credit,
  },
}

export const TestCards: Record<
  CardProviderName,
  Record<TestCardName, TestCard | undefined>
> = {
  stripe: StripeTestCards,
  checkout: CheckoutTestCards,
}

export function getTestCard(
  provider: CardProviderName,
  cardName: TestCardName = 'Visa-No3DS-1',
): TestCard {
  const card = TestCards[provider][cardName]
  if (!card) {
    throw new Error(`No test card ${cardName} for provider ${provider}`)
  }
  return card
}

export async function confirmStripeSetupIntent(
  stripe: Stripe,
  card: TestCard,
  provisioningData: StripeCardProvisionalFundingSourceProvisioningData,
): Promise<Stripe.SetupIntent> {
  const exp = new Date()
  exp.setUTCFullYear(exp.getUTCFullYear() + 1)

  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: {
      // getUTCMonth is indexed at 0, so + 1 is essential.
      exp_month: exp.getUTCMonth() + 1,
      exp_year: exp.getUTCFullYear(),
      number: card.number,
      cvc: card.cvv,
    },
    billing_details: {
      address: {
        line1: card.address.addressLine1,
        line2: card.address.addressLine2,
        city: card.address.city,
        country: card.address.country,
        postal_code: card.address.postalCode,
        state: card.address.state,
      },
    },
  })

  const setupIntent = await stripe.setupIntents.confirm(
    provisioningData.intent,
    {
      payment_method: paymentMethod.id,
      client_secret: provisioningData.clientSecret,
    } as Stripe.SetupIntentCreateParams,
  )

  return setupIntent
}

export async function generateCheckoutPaymentToken(
  checkout: Checkout,
  card: TestCard,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _provisioningData: CheckoutCardProvisionalFundingSourceProvisioningData,
): Promise<string> {
  const exp = new Date()
  exp.setUTCFullYear(exp.getUTCFullYear() + 1)

  const token = (await checkout.tokens.request({
    type: 'card',
    number: card.number,
    cvv: card.cvv,
    expiry_month: exp.getUTCMonth(),
    expiry_year: exp.getUTCFullYear(),
    name: 'John Smith',
    billing_address: {
      address_line1: card.address.addressLine1,
      address_line2: card.address.addressLine2,
      city: card.address.city,
      state: card.address.state,
      zip: card.address.postalCode,
      country: card.address.country,
    },
  })) as { token?: string } | undefined
  if (!token?.token) {
    throw new Error('null token returned from checkout')
  }
  return token.token
}

export const createCardFundingSource = async (
  virtualCardsClient: SudoVirtualCardsClient,
  apis: ProviderAPIs,
  options?: {
    testCard?: TestCardName
    currency?: string
    supportedProviders?: string[]
    updateCardFundingSource?: boolean
  },
): Promise<FundingSource> => {
  const provisionalCard = await virtualCardsClient.setupFundingSource({
    currency: 'USD',
    type: FundingSourceType.CreditCard,
    supportedProviders: options?.supportedProviders,
  })

  const provisioningData = provisionalCard.provisioningData
  const provider = provisioningData.provider
  if (!isCardProviderName(provider)) {
    throw new Error(
      `Unrecognized card provider name in provisioning data: ${provisioningData.provider}`,
    )
  }
  const card = getTestCard(provider, options?.testCard)

  const exp = new Date()
  exp.setUTCFullYear(exp.getUTCFullYear() + 1)

  let completionData: CompleteFundingSourceCompletionDataInput
  if (isStripeCardProvisionalFundingSourceProvisioningData(provisioningData)) {
    const setupIntent = await confirmStripeSetupIntent(
      apis.stripe,
      card,
      provisioningData,
    )
    if (!setupIntent.payment_method) {
      throw 'Failed to get payment_method from setup intent'
    }

    completionData = {
      provider: 'stripe',
      paymentMethod: setupIntent.payment_method.toString(),
    }
  } else if (
    isCheckoutCardProvisionalFundingSourceProvisioningData(provisioningData)
  ) {
    if (!apis.checkout) {
      throw new Error('No checkout API but provisioning data is for checkout')
    }
    const token = await generateCheckoutPaymentToken(
      apis.checkout,
      card,
      provisioningData,
    )
    completionData = {
      provider: 'checkout',
      type: FundingSourceType.CreditCard,
      paymentToken: token,
    }
  } else {
    throw new Error('Unsupported funding source type')
  }

  const fundingSource = (await virtualCardsClient.completeFundingSource({
    id: provisionalCard.id,
    completionData,
    updateCardFundingSource: options?.updateCardFundingSource,
  })) as CreditCardFundingSource

  expect(fundingSource.last4).toEqual(card.last4)
  expect(fundingSource.cardType).toEqual(card.cardType)

  return fundingSource
}
