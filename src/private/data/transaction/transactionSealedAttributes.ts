import { DeclineReason } from '../../../public/typings/transaction'
import {
  CurrencyAmountEntity,
  MarkupEntity,
} from '../../domain/entities/transaction/transactionEntity'

export interface TransactionSealedAttributes {
  billedAmount: CurrencyAmountEntity
  transactedAmount: CurrencyAmountEntity
  description: string
  transactedAtEpochMs: undefined
  transactedAt: Date
  settledAtEpochMs?: undefined
  settledAt: Date
  declineReason?: DeclineReason
  detail?: {
    virtualCardAmount: CurrencyAmountEntity
    markup: MarkupEntity
    markupAmount: CurrencyAmountEntity
    fundingSourceAmount: CurrencyAmountEntity
    fundingSourceId: string
    description: string
  }[]
}
