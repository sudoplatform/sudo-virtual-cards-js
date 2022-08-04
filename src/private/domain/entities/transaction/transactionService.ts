import { CachePolicy, ListOperationResult } from '@sudoplatform/sudo-common'
import { DateRange, SortOrder } from '../../../..'
import { TransactionSealedAttributes } from '../../../data/transaction/transactionSealedAttributes'
import { TransactionEntity } from './transactionEntity'

export interface TransactionServiceGetTransactionInput {
  id: string
  cachePolicy?: CachePolicy
}

export interface TransactionServiceListTransactionsInput {
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
  dateRange?: DateRange
  sortOrder?: SortOrder
}

export interface TransactionServiceListTransactionsByCardIdInput {
  cardId: string
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
  dateRange?: DateRange
  sortOrder?: SortOrder
}

export interface TransactionService {
  getTransaction(
    input: TransactionServiceGetTransactionInput,
  ): Promise<TransactionEntity | undefined>

  listTransactions(
    input: TransactionServiceListTransactionsInput,
  ): Promise<
    ListOperationResult<TransactionEntity, TransactionSealedAttributes>
  >

  listTransactionsByCardId(
    input: TransactionServiceListTransactionsByCardIdInput,
  ): Promise<
    ListOperationResult<TransactionEntity, TransactionSealedAttributes>
  >
}
