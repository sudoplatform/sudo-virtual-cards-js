import { CurrencyAmount } from './currencyAmount'

/**
 * @property {string} id Identifier of the transaction.
 * @property {string} owner Owner Identifier of the transaction.
 * @property {number} version Current version of the transaction.
 * @property {Date} createdAt Date when the transaction was created.
 * @property {Date} updatedAt Date when the transaction was last updated.
 * @property {TransactionType} type Type of the transaction.
 * @property {Date} transactedAt Date when the transaction occurred at the merchant.
 * @property {Date?} settledAt Date when the transaction was completed. Complete and Refund transactions only.
 * @property {string} cardId Identifier of the virtual card associated with the transaction.
 * @property {string} sequenceId Identifier of the sequence of related transactions.
 * @property {CurrencyAmount} billedAmount Amount of transaction in currency of the virtual card.
 * @property {CurrencyAmount} transactedAmount Amount of transaction as charged by the merchant.
 * @property {string} description Transaction statement description
 * @property {DeclineReason} declineReason Reason that the transaction was declined. Decline transactions only.
 * @property {TransactionDetailCharge[]} detail Details of the transaction charge.
 */
export interface Transaction {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  transactedAt: Date
  settledAt?: Date
  cardId: string
  sequenceId: string
  type: TransactionType
  billedAmount: CurrencyAmount
  transactedAmount: CurrencyAmount
  description: string
  declineReason?: DeclineReason
  detail?: TransactionDetailCharge[]
}

/**
 * Type of the transaction.
 */
export enum TransactionType {
  Pending = 'PENDING',
  Complete = 'COMPLETE',
  Refund = 'REFUND',
  Decline = 'DECLINE',
}

/**
 * Decline reason of transaction.
 */
export enum DeclineReason {
  InsufficientFunds = 'INSUFFICIENT_FUNDS',
  FundingError = 'FUNDING_ERROR',
  Suspicious = 'SUSPICIOUS',
  CardStopped = 'CARD_STOPPED',
  CardExpired = 'CARD_EXPIRED',
  MerchantBlocked = 'MERCHANT_BLOCKED',
  MerchantCodeBlocked = 'MERCHANT_CODE_BLOCKED',
  MerchantCountryBlocked = 'MERCHANT_COUNTRY_BLOCKED',
  CurrencyBlocked = 'CURRENCY_BLOCKED',
  AvsCheckFailed = 'AVS_CHECK_FAILED',
  CscCheckFailed = 'CSC_CHECK_FAILED',
  ExpiryCheckFailed = 'EXPIRY_CHECK_FAILED',
  ProcessingError = 'PROCESSING_ERROR',
  VelocityExceeded = 'VELOCITY_EXCEEDED',
  Declined = 'DECLINED',
}

/**
 * State of the transaction charge detail.
 */
export enum ChargeDetailState {
  Pending = 'PENDING', // Funding transaction initiated
  Cleared = 'CLEARED', // Funding transaction cleared
  InsufficientFunds = 'INSUFFICIENT_FUNDS', // Funding transaction failed due to insufficient funds
  Failed = 'FAILED', // Funding transaction deemed failed for another reason
}

/**
 * Detail of a transaction charge.
 */
export interface TransactionDetailCharge {
  virtualCardAmount: CurrencyAmount
  markup: Markup
  markupAmount: CurrencyAmount
  fundingSourceAmount: CurrencyAmount
  fundingSourceId: string
  description: string
  state: ChargeDetailState
}

/**
 * Markup information.
 */
export interface Markup {
  percent: number
  flat: number
  minCharge?: number
}
