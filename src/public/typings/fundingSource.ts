/**
 * The Sudo Platform SDK representation of the funding source client configuration.
 *
 * @interface FundingSourceClientConfiguration
 * @property {string} type Type of the configuration provider.
 * @property {number} version Configuration version.
 * @property {string} apiKey API Key for configuring calls to the provider.
 */
export interface StripeFundingSourceClientConfiguration {
  type: 'stripe'
  version: number
  apiKey: string
}

export type FundingSourceClientConfiguration =
  StripeFundingSourceClientConfiguration

/**
 * The Sudo Platform SDK representation of a funding source.
 *
 * @interface FundingSource
 * @property {string} id Unique identifier of the funding source.
 * @property {string} owner Identifier of the user that owns the funding source.
 * @property {number} version Version of this entity.
 * @property {Date} createdAt Date when the funding source was created.
 * @property {Date} updatedAt Date when the funding source was last updated.
 * @property {FundingSourceState} state The funding source state.
 * @property {string} currency The currency of the funding source.
 * @property {string} last4 The last 4 digits of the funding source credit card.
 * @property {CreditCardNetwork} network The funding source credit card network.
 */
export interface FundingSource {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  state: FundingSourceState
  currency: string
  last4: string
  network: CreditCardNetwork
}

/**
 * Provisioning Data for Stripe Provisional Funding Source.
 *
 * @property {number} version Version of the provisioning data.
 * @property {'stripe'} provider Provider of the provisioning data.
 * @property {string} clientSecret Client secret used to call stripe setup intent.
 * @property {string} intent intent of setup data.
 */
export interface StripeProvisionalFundingSourceProvisioningData {
  version: number
  provider: 'stripe'
  clientSecret: string
  intent: string
}

export type ProvisionalFundingSourceProvisioningData =
  StripeProvisionalFundingSourceProvisioningData

/**
 * The Sudo Platform SDK representation of a funding source.
 *
 * @interface FundingSource
 * @property {string} id Unique identifier of the funding source.
 * @property {string} owner Identifier of the user that owns the funding source.
 * @property {number} version Version of this entity.
 * @property {number} createdAt Date when the funding source was created.
 * @property {number} updatedAt Date when the funding source was last updated.
 * @property {ProvisionalFundingSourceState} state The provisional funding source state.
 * @property {StateReason} stateReason The funding source state reason.
 * @property {string} provisioningData The currency of the funding source.
 */
export interface ProvisionalFundingSource {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  state: ProvisionalFundingSourceState
  stateReason: StateReason
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
 * The Sudo Platform SDK representation of an enumaration depicting the provisional funding source state reason.
 *
 * @enum StateReason
 */
export enum StateReason {
  Admin = 'ADMIN',
  Deletion = 'DELETION',
  Entitlement = 'ENTITLEMENT',
  Locked = 'LOCKED',
  Processing = 'PROCESSING',
  Suspicious = 'SUSPICIOUS',
  Unknown = 'UNKNOWN',
  Unlocked = 'UNLOCKED',
  User = 'USER',
}

/**
 * The Sudo Platform SDK representation of an enumaration depicting the provisional funding source state.
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
 * The Sudo Platform SDK representation of an enumaration depicting the funding source state.
 *
 * @enum FundingSourceState
 */
export enum FundingSourceState {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
}

/**
 * The Sudo Platform SDK representation of an enumaration depicting the funding source type.
 *
 * @enum FundingSourceType
 */
export enum FundingSourceType {
  CreditCard = 'CREDIT_CARD',
}

/**
 * The Sudo Platform SDK representation of an enumaration depicting the provisional funding source credit card network.
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
