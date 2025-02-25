/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthorizationText } from './authorizationText'
import { BankAccountType } from './bankAccountType'
import { CardType } from './cardType'
import { TransactionVelocity } from './transactionVelocity'
import { CurrencyAmount } from './currencyAmount'
import { IDFilterInput } from './identifier'

export interface BaseFundingSourceClientConfiguration {
  type: string
  fundingSourceType: FundingSourceType
  version: number
}

/**
 * The Sudo Platform SDK representation of the funding source client configuration.
 *
 * @interface FundingSourceClientConfiguration
 * @property {string} type Type of the configuration provider.
 * @property {number} version Configuration version.
 * @property {string} apiKey API Key for configuring calls to the provider.
 */
export interface StripeCardFundingSourceClientConfiguration
  extends BaseFundingSourceClientConfiguration {
  type: 'stripe'
  fundingSourceType: FundingSourceType.CreditCard
  version: number
  apiKey: string
}

/**
 * @deprecated Use StripeCardFundingSourceClientConfiguration instead
 */
export type StripeFundingSourceClientConfiguration =
  StripeCardFundingSourceClientConfiguration

export interface CheckoutBankAccountFundingSourceClientConfiguration
  extends BaseFundingSourceClientConfiguration {
  type: 'checkout'
  fundingSourceType: FundingSourceType.BankAccount
  version: number
  apiKey: string
}

export type FundingSourceClientConfiguration =
  | StripeCardFundingSourceClientConfiguration
  | CheckoutBankAccountFundingSourceClientConfiguration

  // Allow this so that future additions are not breaking. Consumers
  // must handle the "unknown" case.
  | BaseFundingSourceClientConfiguration

export function isStripeCardFundingSourceClientConfiguration(
  config: FundingSourceClientConfiguration,
): config is StripeCardFundingSourceClientConfiguration {
  return (
    config.type === 'stripe' &&
    config.fundingSourceType === FundingSourceType.CreditCard
  )
}

export function isCheckoutBankAccountFundingSourceClientConfiguration(
  config: FundingSourceClientConfiguration,
): config is CheckoutBankAccountFundingSourceClientConfiguration {
  return (
    config.type === 'checkout' &&
    config.fundingSourceType === FundingSourceType.BankAccount
  )
}

/**
 * The Sudo Platform SDK representation of common attributes of a funding source.
 *
 * @interface BaseFundingSource
 * @property {string} id Unique identifier of the funding source.
 * @property {string} owner Identifier of the user that owns the funding source.
 * @property {number} version Version of this entity.
 * @property {Date} createdAt Date when the funding source was created.
 * @property {Date} updatedAt Date when the funding source was last updated.
 * @property {FundingSourceState} state The funding source state.
 * @property {string} currency The currency of the funding source.
 * @property {TransactionVelocity} transactionVelocity
 *   Effective transaction velocity, if any, applied to
 *   virtual card transactions funded by this funding source.
 *   This is the combined result of all velocity policies
 *   (global and funding source specific) as at the time this funding
 *   source was retrieved.
 */
export interface BaseFundingSource {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  type: FundingSourceType
  state: FundingSourceState
  flags: FundingSourceFlags[]
  currency: string
  transactionVelocity?: TransactionVelocity
}

/**
 * The Sudo Platform SDK representation of attributes of a credit or debit card
 * funding source.
 *
 * @interface CreditCardFundingSource
 * @extends BaseFundingSource
 * @property {FundingSourceType.CreditCard} type Type of funding source
 * @property {CardType} cardType The type of card
 * @property {string} last4 The last 4 digits of the card number.
 * @property {CreditCardNetwork} network The funding source credit card network.
 */
export interface CreditCardFundingSource extends BaseFundingSource {
  type: FundingSourceType.CreditCard
  cardType: CardType
  last4: string
  network: CreditCardNetwork
}

/**
 * The Sudo Platform SDK representation of attributes of a bank account
 * funding source.
 *
 * @interface BankAccountFundingSource
 * @extends BaseFundingSource
 * @property {FundingSourceType.BankAccount} type Type of funding source
 * @property {BankAccountType} bankAccountType The type of bank account
 * @property {string} last4 The last 4 digits of the bank account number.
 * @property {string} institutionName
 *   The name of the institution at which the bank account is held.
 * @property {string} institutionLogo.type
 *   Mime type of institution logo if any
 * @property {string} institutionLogo.data
 *   Base64 encoded image data of institution logo if any
 * @property { CurrencyAmount} unfundedAmount
 *   If this bank account funding source is unfunded, the amount by which it is unfunded
 *   in the funding source's currency. Undefined otherwise
 */
export interface BankAccountFundingSource extends BaseFundingSource {
  type: FundingSourceType.BankAccount
  bankAccountType: BankAccountType
  last4: string
  institutionName: string
  institutionLogo?: {
    type: string
    data: string
  }
  unfundedAmount?: CurrencyAmount
}

export type FundingSource = CreditCardFundingSource | BankAccountFundingSource

export function isCreditCardFundingSource(
  fundingSource: FundingSource,
): fundingSource is CreditCardFundingSource {
  return fundingSource.type === FundingSourceType.CreditCard
}

/**
 * Base shape of provider specific provisioningData property
 * of ProvisionalFundingSource returned by setupFundingSource
 *
 * @property {string} provider Provider of the provisioning data.
 * @property {number} version Version of the format of the provisioning data.
 * @property {FundingSourceType} type Type of funding source provider
 */
export interface BaseProvisionalFundingSourceProvisioningData {
  provider: string
  version: number
  type: FundingSourceType
}

/**
 * Provisioning data for Stripe provisional funding source.
 *
 * @property {'stripe'} provider Provider of the provisioning data.
 * @property {1} version Version of the format of the provisioning data.
 * @property {FundingSourceType.CreditCard} type Type of funding source provider
 * @property {string} clientSecret Client secret used to call stripe setup intent.
 * @property {string} intent intent of setup data.
 */
export interface StripeCardProvisionalFundingSourceProvisioningData
  extends BaseProvisionalFundingSourceProvisioningData {
  provider: 'stripe'
  version: 1
  type: FundingSourceType.CreditCard
  clientSecret: string
  intent: string
}

/**
 * Provisioning data for Checkout bank account provisional funding source.
 *
 * @property {'checkout'} provider Provider of the provisioning data.
 * @property {1} version Version of the format of the provisioning data.
 * @property {FundingSourceType.BankAccount} type Type of funding source provider.
 * @property {string} linkToken Plaid Link link token for use in initializing Plaid Link
 * @property {AuthorizationText[]} authorizationText
 *   Array of different content type representations of the same agreement in the language
 *   most closely matching the language specified in the call to
 *   {@link SudoVirtualCardsClient.setupFundingSource}
 */
export interface CheckoutBankAccountProvisionalFundingSourceProvisioningData {
  provider: 'checkout'
  version: 1
  type: FundingSourceType.BankAccount
  linkToken: string
  authorizationText: AuthorizationText[]
}

export type ProvisionalFundingSourceProvisioningData =
  | StripeCardProvisionalFundingSourceProvisioningData
  | CheckoutBankAccountProvisionalFundingSourceProvisioningData
  | BaseProvisionalFundingSourceProvisioningData

export function isStripeCardProvisionalFundingSourceProvisioningData(
  data: ProvisionalFundingSourceProvisioningData,
): data is StripeCardProvisionalFundingSourceProvisioningData {
  return (
    data.provider === 'stripe' &&
    data.type === FundingSourceType.CreditCard &&
    data.version === 1
  )
}

export function isCheckoutBankAccountProvisionalFundingSourceProvisioningData(
  data: ProvisionalFundingSourceProvisioningData,
): data is CheckoutBankAccountProvisionalFundingSourceProvisioningData {
  return (
    data.provider === 'checkout' &&
    data.type === FundingSourceType.BankAccount &&
    data.version === 1
  )
}

/**
 * Base shape of provider specific provisioningData property
 * of FundingSourceRequiresUserInteractionError thrown by
 * completeFundingSource when additional user interaction
 * is required before funding source provisioning can complete.
 */
export type BaseProvisionalFundingSourceInteractionData =
  BaseProvisionalFundingSourceProvisioningData

export interface CheckoutBankAccountRefreshFundingSourceInteractionData
  extends BaseProvisionalFundingSourceInteractionData {
  provider: 'checkout'
  version: 1
  type: FundingSourceType.BankAccount
  linkToken: string
  authorizationText: AuthorizationText[]
}

export type FundingSourceInteractionData =
  | CheckoutBankAccountRefreshFundingSourceInteractionData
  | BaseProvisionalFundingSourceProvisioningData

export function isCheckoutBankAccountRefreshFundingSourceInteractionData(
  data: FundingSourceInteractionData,
): data is CheckoutBankAccountRefreshFundingSourceInteractionData {
  return (
    data.provider === 'checkout' &&
    data.type === FundingSourceType.BankAccount &&
    data.version === 1
  )
}

/**
 * The Sudo Platform SDK representation of a provisional funding source.
 *
 * @interface ProvisionalFundingSource
 * @property {string} id Unique identifier of the provisional funding source.
 * @property {string} owner Identifier of the user that owns the provisional funding source.
 * @property {number} version Current version of the provisional funding source.
 * @property {number} createdAt Date when the provisional funding source was created.
 * @property {number} updatedAt Date when the provisional funding source was last updated.
 * @property {string} last4 The last 4 digits of the funding source account number.
 * @property {ProvisionalFundingSourceState} state The provisional funding source state.
 * @property {string} provisioningData Provisioning data provided by the funding source provider.
 */
export interface ProvisionalFundingSource {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  type: FundingSourceType
  state: ProvisionalFundingSourceState
  last4: string
  provisioningData: ProvisionalFundingSourceProvisioningData
}

/**
 * The Sudo Platform SDK representation of a funding source.
 *
 * @interface FundingSource
 * @property {string} creditCardNumber The funding source credit card number.
 * @property {number} expirationMonth The credit card expiration month.
 * @property {number} expirationYear The credit card expiration year.
 * @property {string} securityCode The credit card security code.
 * @property {string} addressLine1 Address line 1 of the funding source.
 * @property {string} addressLine2 Address line 2 of the funding source.
 * @property {string} city The city of the funding source.
 * @property {string} state The state of the funding source.
 * @property {string} postalCode The state of the funding source.
 * @property {string} country The state of the funding source.
 * @property {FundingSourceType} type The funding source type.
 * @property {string} currency The currency of the funding source.
 */
export interface CreditCardFundingSourceInput {
  creditCardNumber: string
  expirationMonth: number
  expirationYear: number
  securityCode: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  country: string
  type: FundingSourceType
  currency: string
}

/**
 * The Sudo Platform SDK representation of an enumeration depicting the provisional funding source state.
 *
 * @enum ProvisionalFundingSourceState
 */
export enum ProvisionalFundingSourceState {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Provisioning = 'PROVISIONING',
}

/**
 * The Sudo Platform SDK representation of a filter used to filter provisional funding source entities based
 * on their provisional funding source state.
 *
 * @property {ProvisionalFundingSourceState} eq The provisional funding source state must be equal to this field.
 * @property {ProvisionalFundingSourceState} ne The provisional funding source state must not be equal to this field.
 */
export type ProvisionalFundingSourceStateFilterInput = {
  eq?: ProvisionalFundingSourceState
  ne?: ProvisionalFundingSourceState
}

/**
 * The Sudo Platform SDK representation of a filter used to filter provisional funding source entities.
 *
 * @property {IDFilterInput} id The provisional funding source id must match this filter.
 * @property {ProvisionalFundingSourceStateFilterInput} state The provisional funding source state must match this filter.
 * @property {ProvisionalFundingSourceFilterInput[]} and The provisional funding sources must match the logical and
 *  of the `ProvisionalFundingSourceFilterInput` entries in this array.
 * @property {ProvisionalFundingSourceFilterInput} not The provisional funding source must not match this filter.
 * @property {ProvisionalFundingSourceFilterInput[]} or The provisional funding sources must match the logical or
 *  of the `ProvisionalFundingSourceFilterInput` entries in this array.
 */
export type ProvisionalFundingSourceFilterInput = {
  id?: IDFilterInput
  state?: ProvisionalFundingSourceStateFilterInput
  and?: ProvisionalFundingSourceFilterInput[]
  not?: ProvisionalFundingSourceFilterInput
  or?: ProvisionalFundingSourceFilterInput[]
}

/**
 * The Sudo Platform SDK representation of an enumeration depicting the funding source state.
 *
 * @enum FundingSourceState
 */
export enum FundingSourceState {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
}

/**
 * The Sudo Platform SDK representation of an enumeration depicting the set of possible funding source flags.
 *
 * @enum FundingSourceFlags
 */
export enum FundingSourceFlags {
  Unfunded = 'UNFUNDED',
  Refresh = 'REFRESH',
}

/**
 * The Sudo Platform SDK representation of a filter used to filter funding source entities based
 * on their funding source state.
 *
 * @property {FundingSourceState} eq The funding source state must be equal to this field.
 * @property {FundingSourceState} ne The funding source state must not be equal to this field.
 */
export type FundingSourceStateFilterInput = {
  eq?: FundingSourceState
  ne?: FundingSourceState
}

/**
 * The Sudo Platform SDK representation of a filter used to filter funding source entities.
 *
 * @property {IDFilterInput} id The funding source id must match this filter.
 * @property {FundingSourceStateFilterInput} state The funding source state must match this filter.
 * @property {FundingSourceFilterInput[]} and The funding sources must match the logical and
 *  of the `FundingSourceFilterInput` entries in this array.
 * @property {FundingSourceFilterInput} not The funding source must not match this filter.
 * @property {FundingSourceFilterInput[]} or The funding sources must match the logical or
 *  of the `FundingSourceFilterInput` entries in this array.
 */
export type FundingSourceFilterInput = {
  id?: IDFilterInput
  state?: FundingSourceStateFilterInput
  and?: FundingSourceFilterInput[]
  not?: FundingSourceFilterInput
  or?: FundingSourceFilterInput[]
}

export function isFundingSourceUnfunded(fs: FundingSource): boolean {
  return fs.flags.includes(FundingSourceFlags.Unfunded)
}

export function fundingSourceNeedsRefresh(fs: FundingSource): boolean {
  return fs.flags.includes(FundingSourceFlags.Refresh)
}

/**
 * The Sudo Platform SDK representation of an enumeration depicting the funding source type.
 *
 * @enum FundingSourceType
 */
export enum FundingSourceType {
  CreditCard = 'CREDIT_CARD',
  BankAccount = 'BANK_ACCOUNT',
}

/**
 * The Sudo Platform SDK representation of an enumeration depicting the provisional funding source credit card network.
 *
 * @enum CreditCardNetwork
 */
export enum CreditCardNetwork {
  Amex = 'AMEX',
  Diners = 'DINERS',
  Discover = 'DISCOVER',
  Jcb = 'JCB',
  Mastercard = 'MASTERCARD',
  Other = 'OTHER',
  Unionpay = 'UNIONPAY',
  Visa = 'VISA',
}

/**
 * Connection state of a subscription.
 */
export enum ConnectionState {
  /**
   * Connected and receiving updates.
   */
  Connected,

  /**
   * Disconnected and won't receive any updates. When disconnected all subscribers will be
   * unsubscribed so the consumer must re-subscribe.
   */
  Disconnected,
}

export interface FundingSourceChangeSubscriber {
  /**
   * Notifies the subscriber that the funding source has changed.
   *
   * @param fundingSource The changed funding source.
   */
  fundingSourceChanged(fundingSource: FundingSource): Promise<void>

  /**
   * Notifies the subscriber that the subscription connection state has changed. The subscriber won't be
   * notified of funding source changes until the connection status changes to [ConnectionState.CONNECTED]. The subscriber will
   * stop receiving funding source change notifications when the connection state changes to [ConnectionState.DISCONNECTED].
   * @param state connection state.
   */
  connectionStatusChanged?(state: ConnectionState): void
}
