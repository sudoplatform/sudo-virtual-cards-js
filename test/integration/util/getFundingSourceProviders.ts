/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { FatalError } from '@sudoplatform/sudo-common'
import { Checkout } from 'checkout-sdk-node'
import Stripe from 'stripe'
import {
  isCheckoutBankAccountFundingSourceClientConfiguration,
  isStripeCardFundingSourceClientConfiguration,
  SudoVirtualCardsClient,
} from '../../../src'

export interface FundingSourceProviders {
  stripeCardEnabled: boolean
  checkoutBankAccountEnabled: boolean
  apis: {
    stripe: Stripe
    checkout?: Checkout
  }
}
export const getFundingSourceProviders = async (
  vcClient: SudoVirtualCardsClient,
): Promise<FundingSourceProviders> => {
  const config = await vcClient.getVirtualCardsConfig()

  let stripe: Stripe | undefined
  let checkout: Checkout | undefined

  let stripeCardEnabled = false
  let checkoutBankAccountEnabled = false

  for (const fsConfig of config.fundingSourceClientConfiguration) {
    if (isStripeCardFundingSourceClientConfiguration(fsConfig)) {
      stripe = new Stripe(fsConfig.apiKey, {
        apiVersion: '2024-12-18.acacia',
        typescript: true,
      })
      stripeCardEnabled = true
    } else if (
      isCheckoutBankAccountFundingSourceClientConfiguration(fsConfig)
    ) {
      checkout = new Checkout(undefined, {
        pk: fsConfig.apiKey,
      })
      if (
        isCheckoutBankAccountFundingSourceClientConfiguration(fsConfig) &&
        config.bankAccountFundingSourceCreationEnabled
      ) {
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
    checkoutBankAccountEnabled,
    apis: {
      stripe,
      checkout,
    },
  }
}
