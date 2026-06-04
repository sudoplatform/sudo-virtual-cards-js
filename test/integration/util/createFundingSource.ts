/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  SetupIntent,
  SetupIntentCreateParams,
} from 'stripe/cjs/resources/SetupIntents.js'

import {
  CardType,
  CompleteFundingSourceCompletionDataInput,
  FundingSource,
  FundingSourceType,
  isStripeCardProvisionalFundingSourceProvisioningData,
  StripeCardProvisionalFundingSourceProvisioningData,
  SudoVirtualCardsClient,
} from '../../../src'
import {
  FundingSourceProviders,
  StripeClient,
} from './getFundingSourceProviders'

export const CardProviderNames = ['stripe'] as const

export type CardProviderName = (typeof CardProviderNames)[number]
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
}

export const TestCardNames = [
  'Visa-3DS2-1',
  'Visa-3DS2-2',
  'Visa-No3DS-1',
  'MC-No3DS-1',
  'BadAddress',
] as const
export type TestCardName = (typeof TestCardNames)[number]

export type TestCard = {
  number: string
  cvv: string
  last4: string
  cardType: CardType
  address: TestCardBillingAddress
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
    number: '5200828282828210',
    cvv: '123',
    last4: '8210',
    address: DefaultTestCardBillingAddress['stripe'],
    cardType: CardType.Debit,
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
  stripe: StripeClient,
  card: TestCard,
  provisioningData: StripeCardProvisionalFundingSourceProvisioningData,
): Promise<SetupIntent> {
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
    } as SetupIntentCreateParams,
  )

  return setupIntent
}

export const createCardFundingSource = async (
  virtualCardsClient: SudoVirtualCardsClient,
  fundingSourceProviders: FundingSourceProviders,
  options?: {
    testCard?: TestCardName
    currency?: string
    supportedProviders?: string[]
    applicationName?: string
    updateCardFundingSource?: boolean
  },
): Promise<FundingSource> => {
  const provisionalFundingSource = await virtualCardsClient.setupFundingSource({
    currency: 'USD',
    type: FundingSourceType.CreditCard,
    supportedProviders: options?.supportedProviders,
    applicationName: options?.applicationName ?? 'webApplication',
  })

  const provisioningData = provisionalFundingSource.provisioningData
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
      fundingSourceProviders.apis.stripe,
      card,
      provisioningData,
    )
    if (!setupIntent.payment_method) {
      throw 'Failed to get payment_method from setup intent'
    }

    const paymentMethod =
      typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method.id
    completionData = {
      provider: 'stripe',
      paymentMethod,
    }
  } else {
    throw new Error('Unsupported funding source type')
  }

  const fundingSource = await virtualCardsClient.completeFundingSource({
    id: provisionalFundingSource.id,
    completionData,
    updateCardFundingSource: options?.updateCardFundingSource,
  })

  expect(fundingSource.last4).toEqual(card.last4)
  expect(fundingSource.cardType).toEqual(card.cardType)

  return fundingSource
}
