/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { FatalError } from '@sudoplatform/sudo-common'
import Stripe from 'stripe'

import {
  isStripeCardFundingSourceClientConfiguration,
  SudoVirtualCardsClient,
} from '../../../src'

export type StripeClient = InstanceType<typeof Stripe>

export interface FundingSourceProviders {
  stripeCardEnabled: boolean
  apis: {
    stripe: StripeClient
  }
}
export const getFundingSourceProviders = async (
  vcClient: SudoVirtualCardsClient,
): Promise<FundingSourceProviders> => {
  const config = await vcClient.getVirtualCardsConfig()

  let stripe: StripeClient | undefined

  let stripeCardEnabled = false

  for (const fsConfig of config.fundingSourceClientConfiguration) {
    if (isStripeCardFundingSourceClientConfiguration(fsConfig)) {
      stripe = new Stripe(fsConfig.apiKey, {
        apiVersion: '2026-05-27.dahlia',
        typescript: true,
      })
      stripeCardEnabled = true
    }
  }

  if (!stripe) {
    throw new FatalError(
      'Stripe is mandatory provider but no client configuration found',
    )
  }

  return {
    stripeCardEnabled,
    apis: {
      stripe,
    },
  }
}

export const getStripe = async (
  vcClient: SudoVirtualCardsClient,
): Promise<StripeClient> => {
  const fundingSourceProviders = await getFundingSourceProviders(vcClient)

  if (!fundingSourceProviders.apis.stripe) {
    throw new Error('Stripe config not found')
  }
  return fundingSourceProviders.apis.stripe
}
