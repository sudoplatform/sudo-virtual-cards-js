import { FatalError } from '@sudoplatform/sudo-common'
import { Checkout } from 'checkout-sdk-node'
import Stripe from 'stripe'
import {
  isCheckoutBankAccountFundingSourceClientConfiguration,
  isCheckoutCardFundingSourceClientConfiguration,
  isStripeCardFundingSourceClientConfiguration,
  SudoVirtualCardsClient,
} from '../../../src'

export interface FundingSourceProviders {
  stripeCardEnabled: boolean
  checkoutCardEnabled: boolean
  checkoutBankAccountEnabled: boolean
  apis: {
    stripe: Stripe
    checkout?: Checkout
  }
}
export const getFundingSourceProviders = async (
  vcClient: SudoVirtualCardsClient,
): Promise<FundingSourceProviders> => {
  const config = await vcClient.getFundingSourceClientConfiguration()

  let stripe: Stripe | undefined
  let checkout: Checkout | undefined

  let stripeCardEnabled = false
  let checkoutCardEnabled = false
  let checkoutBankAccountEnabled = false

  for (const fsConfig of config) {
    if (isStripeCardFundingSourceClientConfiguration(fsConfig)) {
      stripe = new Stripe(fsConfig.apiKey, {
        apiVersion: '2022-11-15',
        typescript: true,
      })
      stripeCardEnabled = true
    } else if (
      isCheckoutCardFundingSourceClientConfiguration(fsConfig) ||
      isCheckoutBankAccountFundingSourceClientConfiguration(fsConfig)
    ) {
      checkout = new Checkout(undefined, {
        pk: fsConfig.apiKey,
      })
      if (isCheckoutCardFundingSourceClientConfiguration(fsConfig)) {
        checkoutCardEnabled = true
      }
      if (isCheckoutBankAccountFundingSourceClientConfiguration(fsConfig)) {
        checkoutBankAccountEnabled = true
      }
    }
  }

  if (!stripe) {
    throw new FatalError(
      'Stripe is mandatory provider but no client configuration found',
    )
  }

  return {
    stripeCardEnabled,
    checkoutCardEnabled,
    checkoutBankAccountEnabled,
    apis: {
      stripe,
      checkout,
    },
  }
}
