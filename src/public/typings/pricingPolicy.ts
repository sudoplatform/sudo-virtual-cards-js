/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Markup } from './markup'

/**
 * Representation of the pricing policy for each funding source provider
 * which make up a component of the virtual cards configuration.
 */
export interface PricingPolicy {
  stripe?: StripePricingPolicy
  checkout?: CheckoutPricingPolicy
}

export interface StripePricingPolicy {
  creditCard: { [key: string]: TieredMarkupPolicy }
}

export interface CheckoutPricingPolicy {
  creditCard: { [key: string]: TieredMarkupPolicy }
  bankAccount: { [key: string]: TieredMarkupPolicy }
}

export interface TieredMarkup {
  markup: Markup
  minThreshold?: number
}

export interface TieredMarkupPolicy {
  tiers: TieredMarkup[]
}
