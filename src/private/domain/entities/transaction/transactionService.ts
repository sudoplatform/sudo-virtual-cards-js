import { CachePolicy, ListOperationResult } from '@sudoplatform/sudo-common'
import { DateRange, SortOrder, TransactionFilter } from '../../../..'
import { TransactionSealedAttributes } from '../../../data/transaction/transactionSealedAttributes'
import { TransactionEntity } from './transactionEntity'

export interface TransactionServiceGetTransactionInput {
  id: string
  cachePolicy?: CachePolicy
}

export interface TransactionServiceListTransactionsByCardIdInput {
  cardId: string
  cachePolicy?: CachePolicy
  filter?: TransactionFilter
  limit?: number
  nextToken?: string
  dateRange?: DateRange
  sortOrder?: SortOrder
}

export interface TransactionService {
  getTransaction(
    input: TransactionServiceGetTransactionInput,
  ): Promise<TransactionEntity | undefined>

  listTransactionsByCardId(
    input: TransactionServiceListTransactionsByCardIdInput,
  ): Promise<
    ListOperationResult<TransactionEntity, TransactionSealedAttributes>
  >
}
