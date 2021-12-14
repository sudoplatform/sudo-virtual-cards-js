/**
 * @property {string} id Identifier of the virtual card.
 * @property {string} owner Owner Identifier of the virtual card.
 * @property {number} version Current version record of the virtual card.
 * @property {Date} createdAt Date of when the virtual card was created.
 * @property {Date} updatedAt Date of when the virtual card was last updated.
 * @property {Date} transactedAt Date of when the virtual card was transacted.
 * @property {string} cardId Identifier of the virtual card associated with the transaction.
 * @property {string} sequenceId Identifier of the sequence of the transaction that it is involved in.
 * @property {CurrencyAmount} billedAmount Amount billed per the transaction.
 * @property {CurrencyAmount} transactedAmount Amount transacted per the transaction.
 * @property {string} description Information describing of the transaction
 * @property {DeclineReason} declineReason Reason that the transaction was declined. Undefined in the transaction is not a decline.
 * @property {TransactionDetailCharge[]} detail Details of the transaction charge.
 */
export interface Transaction {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  transactedAt: Date
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
 * Amount with related currency code.
 */
export interface CurrencyAmount {
  /**
   * ISO-3 Currency Code.
   */
  currency: string
  /**
   * Amount of currency.
   */
  amount: number
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
 * Detail of a transaction charge.
 */
export interface TransactionDetailCharge {
  virtualCardAmount: CurrencyAmount
  markup: Markup
  markupAmount: CurrencyAmount
  fundingSourceAmount: CurrencyAmount
  fundingSourceId: string
  description: string
}

/**
 * Markup information.
 */
export interface Markup {
  percent: number
  flat: number
  minCharge?: number
}
