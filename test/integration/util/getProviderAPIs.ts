import { FatalError } from '@sudoplatform/sudo-common'
import { Checkout } from 'checkout-sdk-node'
import Stripe from 'stripe'
import {
  isCheckoutBankAccountFundingSourceClientConfiguration,
  isCheckoutCardFundingSourceClientConfiguration,
  isStripeCardFundingSourceClientConfiguration,
  SudoVirtualCardsClient,
} from '../../../src'

export interface ProviderAPIs {
  stripe: Stripe
  checkout?: Checkout
}
export const getProviderAPIs = async (
  vcClient: SudoVirtualCardsClient,
): Promise<ProviderAPIs> => {
  const config = await vcClient.getFundingSourceClientConfiguration()

  let stripe: Stripe | undefined
  let checkout: Checkout | undefined

  for (const fsConfig of config) {
    if (isStripeCardFundingSourceClientConfiguration(fsConfig)) {
      stripe = new Stripe(fsConfig.apiKey, {
        apiVersion: '2022-11-15',
        typescript: true,
      })
    } else if (
      isCheckoutCardFundingSourceClientConfiguration(fsConfig) ||
      isCheckoutBankAccountFundingSourceClientConfiguration(fsConfig)
    ) {
      checkout = new Checkout(undefined, {
        pk: fsConfig.apiKey,
      })
    }
  }

  if (!stripe) {
    throw new FatalError(
      'Stripe is mandatory provider but no client configuration found',
    )
  }

  return {
    stripe,
    checkout,
  }
}
