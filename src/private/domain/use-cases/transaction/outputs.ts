import {
  ChargeDetailState,
  DeclineReason,
  TransactionType,
} from '../../../../public/typings/transaction'

export interface CurrencyAmountUseCaseOutput {
  currency: string
  amount: number
}

export interface TransactionUseCaseOutput {
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
  billedAmount: CurrencyAmountUseCaseOutput
  transactedAmount: CurrencyAmountUseCaseOutput
  description: string
  declineReason?: DeclineReason
  detail?: {
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
    state: ChargeDetailState
  }[]
}
