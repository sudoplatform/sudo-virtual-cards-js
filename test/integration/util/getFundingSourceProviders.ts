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
        apiVersion: '2025-01-27.acacia',
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

export const getStripe = async (
  vcClient: SudoVirtualCardsClient,
): Promise<Stripe> => {
  const fundingSourceProviders = await getFundingSourceProviders(vcClient)

  if (!fundingSourceProviders.apis.stripe) {
    throw new Error('Stripe config not found')
  }
  return fundingSourceProviders.apis.stripe
}
