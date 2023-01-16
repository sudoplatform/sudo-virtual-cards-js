import { AuthorizationText } from './authorizationText'
import { BankAccountType } from './bankAccountType'
import { CardType } from './cardType'

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

export interface CheckoutCardFundingSourceClientConfiguration
  extends BaseFundingSourceClientConfiguration {
  type: 'checkout'
  fundingSourceType: FundingSourceType.CreditCard
  version: number
  apiKey: string
}

export interface CheckoutBankAccountFundingSourceClientConfiguration
  extends BaseFundingSourceClientConfiguration {
  type: 'checkout'
  fundingSourceType: FundingSourceType.BankAccount
  version: number
  apiKey: string
}

export type FundingSourceClientConfiguration =
  | StripeCardFundingSourceClientConfiguration
  | CheckoutCardFundingSourceClientConfiguration
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

export function isCheckoutCardFundingSourceClientConfiguration(
  config: FundingSourceClientConfiguration,
): config is CheckoutCardFundingSourceClientConfiguration {
  return (
    config.type === 'checkout' &&
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
 * @property {string} last4 The last 4 digits of the funding source credit card.
 * @property {CreditCardNetwork} network The funding source credit card network.
 */
export interface BaseFundingSource {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  type: FundingSourceType
  state: FundingSourceState
  currency: string
}

/**
 * The Sudo Platform SDK representation of attributes of a credit or debit card
 * funding source.
 *
 * @interface CreditCardFundingSource
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
 * @property {BankAccountType} bankAccountType The type of bank account
 * @property {string} last4 The last 4 digits of the bank account number.
 * @property {string} institutionName
 *   The name of the institution at which the bank account is held.
 * @property {string} institutionLogo.type
 *   Mime type of institution logo if any
 * @property {string} institutionLogo.data
 *   Base64 encoded image data of institution logo if any
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
 * @deprecated Use StripeCardProvisionalFundingSourceProvisioningData
 */
export type StripeProvisionalFundingSourceProvisioningData =
  StripeCardProvisionalFundingSourceProvisioningData

/**
 * Provisioning data for Checkout card provisional funding source.
 *
 * @property {'checkout'} provider Provider of the provisioning data.
 * @property {1} version Version of the format of the provisioning data.
 * @property {FundingSourceType.CreditCard} type Type of funding source provider.
 */
export interface CheckoutCardProvisionalFundingSourceProvisioningData {
  provider: 'checkout'
  version: 1
  type: FundingSourceType.CreditCard
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
  | CheckoutCardProvisionalFundingSourceProvisioningData
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

export function isCheckoutCardProvisionalFundingSourceProvisioningData(
  data: ProvisionalFundingSourceProvisioningData,
): data is CheckoutCardProvisionalFundingSourceProvisioningData {
  return (
    data.provider === 'checkout' &&
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

/**
 * Interaction data for Checkout provisional funding source.
 *
 * @property {'checkout'} provider Provider of the interaction data.
 * @property {1} version Version of the format of the interaction data.
 * @property {FundingSourceType.CreditCard} type Type of funding source provider
 */
export interface CheckoutCardProvisionalFundingSourceInteractionData
  extends BaseProvisionalFundingSourceInteractionData {
  provider: 'checkout'
  version: 1
  type: FundingSourceType.CreditCard
  redirectUrl: string
}

export type ProvisionalFundingSourceInteractionData =
  | CheckoutCardProvisionalFundingSourceInteractionData
  | BaseProvisionalFundingSourceProvisioningData

export function isCheckoutCardProvisionalFundingSourceInteractionData(
  data: ProvisionalFundingSourceInteractionData,
): data is CheckoutCardProvisionalFundingSourceInteractionData {
  return (
    data.provider === 'checkout' &&
    data.type === FundingSourceType.CreditCard &&
    data.version === 1
  )
}

/**
 * The Sudo Platform SDK representation of a funding source.
 *
 * @interface ProvisionalFundingSource
 * @property {string} id Unique identifier of the provisional funding source.
 * @property {string} owner Identifier of the user that owns the provisional funding source.
 * @property {number} version Current version of the provisional funding source.
 * @property {number} createdAt Date when the provisional funding source was created.
 * @property {number} updatedAt Date when the provisional funding source was last updated.
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
 * The Sudo Platform SDK representation of an enumeration depicting the funding source state.
 *
 * @enum FundingSourceState
 */
export enum FundingSourceState {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
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
