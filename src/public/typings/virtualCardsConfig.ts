/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CardType } from './cardType'
import { CurrencyAmount } from './currencyAmount'
import { FundingSourceClientConfiguration } from './fundingSource'
import { PricingPolicy } from './pricingPolicy'

/**
 * The Sudo Platform SDK representation of virtual cards configuration data.
 *
 * @interface VirtualCardsConfig
 * @property {string[]} maxFundingSourceVelocity The maximum number of funding sources that can be created within a defined period.
 * @property {string[]} maxFundingSourceFailureVelocity The maximum number of funding sources that can be created within a defined period.
 * @property {string[]} maxCardCreationVelocity The maximum number of virtual cards that can be created within a defined period.
 * @property {CurrencyVelocity[]} maxTransactionVelocity The maximum number of transactions that can be created within a defined period.
 * @property {CurrencyAmount[]} maxTransactionAmount The maximum transaction amount per currency.
 * @property {string[]} virtualCardCurrencies The list of supported virtual card currencies.
 * @property {ProviderCardFundingSourceSupportDetail[]} fundingSourceSupportInfo Funding source support info.
 * @property {Boolean} bankAccountFundingSourceCreationEnabled Flag determining whether bank account funding source creation flows are enabled.
 *  Mainly used to test edge cases around bank account funding.
 * @property {FundingSourceClientConfiguration[]} fundingSourceClientConfiguration The funding source client configuration.
 * @property {[applicationName: string]: ClientApplicationConfiguration} clientApplicationConfiguration The client application
 *  configuration keyed by application name.
 * @property {PricingPolicy} pricingPolicy The pricing policy for each funding source provider.
 */
export interface VirtualCardsConfig {
  maxFundingSourceVelocity: string[]
  maxFundingSourceFailureVelocity: string[]
  maxCardCreationVelocity: string[]
  maxTransactionVelocity: CurrencyVelocity[]
  maxTransactionAmount: CurrencyAmount[]
  virtualCardCurrencies: string[]
  fundingSourceSupportInfo: FundingSourceSupportInfo[]
  bankAccountFundingSourceExpendableEnabled: boolean
  bankAccountFundingSourceCreationEnabled?: boolean
  fundingSourceClientConfiguration: FundingSourceClientConfiguration[]
  clientApplicationConfiguration: {
    [applicationName: string]: ClientApplicationConfiguration
  }
  pricingPolicy?: PricingPolicy
}

export interface FundingSourceSupportDetail {
  cardType: CardType
}

export interface FundingSourceSupportInfo {
  providerType: string
  fundingSourceType: string
  network: string
  detail: FundingSourceSupportDetail[]
}

export interface Velocity {
  amount: string
  period: string
}

export interface CurrencyVelocity {
  currency: string
  velocity: string[]
}

export interface ClientApplicationConfiguration {
  funding_source_providers: FundingSourceProvider
}

export interface FundingSourceProvider {
  plaid: PlaidApplicationConfiguration
}

export interface PlaidApplicationConfiguration {
  client_name: string
  redirect_uri: string
}
