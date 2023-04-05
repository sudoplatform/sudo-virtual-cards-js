import {
  ChargeDetailState,
  DeclineReason,
  TransactionType,
} from '../../../../public/typings/transaction'

export interface TransactionEntity {
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
  billedAmount: CurrencyAmountEntity
  transactedAmount: CurrencyAmountEntity
  description: string
  declineReason?: DeclineReason
  detail?: TransactionDetailChargeEntity[]
}

export interface CurrencyAmountEntity {
  currency: string
  amount: number
}

export interface TransactionDetailChargeEntity {
  virtualCardAmount: CurrencyAmountEntity
  markup: MarkupEntity
  markupAmount: CurrencyAmountEntity
  fundingSourceAmount: CurrencyAmountEntity
  fundingSourceId: string
  description: string
  state: ChargeDetailState
  continuationOfExistingCharge: boolean
}

export interface MarkupEntity {
  percent: number
  flat: number
  minCharge?: number
}
