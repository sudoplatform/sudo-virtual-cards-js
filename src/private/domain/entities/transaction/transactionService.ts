/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CachePolicy, ListOperationResult } from '@sudoplatform/sudo-common'
import { TransactionType } from '../../../../public'
import { DateRange } from '../../../../public/typings/dateRange'
import { SortOrder } from '../../../../public/typings/sortOrder'
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

export interface TransactionServiceListTransactionsByCardIdAndTypeInput {
  cardId: string
  transactionType: TransactionType
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
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

  listTransactionsByCardIdAndType(
    input: TransactionServiceListTransactionsByCardIdAndTypeInput,
  ): Promise<
    ListOperationResult<TransactionEntity, TransactionSealedAttributes>
  >
}
