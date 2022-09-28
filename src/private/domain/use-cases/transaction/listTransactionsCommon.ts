import { DeclineReason } from '../../../../public/typings/transaction'

export interface CurrencyAmountUseCaseOutput {
  currency: string
  amount: number
}

export interface TransactionDetailChargeUseCaseOutput {
  virtualCardAmount: CurrencyAmountUseCaseOutput
  markup: {
    percent: number
    flat: number
    minCharge?: number
  }
  markupAmount: CurrencyAmountUseCaseOutput
  fundingSourceAmount: CurrencyAmountUseCaseOutput
  fundingSourceId: string
  description: string
}

export interface TransactionSealedAttributesUseCaseOutput {
  billedAmount: CurrencyAmountUseCaseOutput
  transactedAmount: CurrencyAmountUseCaseOutput
  description: string
  transactedAtEpochMs: undefined
  transactedAt: Date
  settledAt?: Date
  declineReason?: DeclineReason
  detail?: TransactionDetailChargeUseCaseOutput[]
}
