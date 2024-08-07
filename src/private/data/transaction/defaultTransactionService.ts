/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ListOperationResult,
  ListOperationResultStatus,
} from '@sudoplatform/sudo-common'
import _ from 'lodash'
import { SealedTransaction } from '../../../gen/graphqlTypes'
import { TransactionEntity } from '../../domain/entities/transaction/transactionEntity'
import {
  TransactionService,
  TransactionServiceGetTransactionInput,
  TransactionServiceListTransactionsByCardIdAndTypeInput,
  TransactionServiceListTransactionsByCardIdInput,
  TransactionServiceListTransactionsInput,
} from '../../domain/entities/transaction/transactionService'
import { ApiClient } from '../common/apiClient'
import {
  TransactionUnsealed,
  TransactionWorker,
} from '../common/transactionWorker'
import { DateRangeTransformer } from '../common/transformer/dateRangeTransformer'
import { FetchPolicyTransformer } from '../common/transformer/fetchPolicyTransformer'
import { TransactionSealedAttributes } from './transactionSealedAttributes'
import { TransactionEntityTransformer } from './transformer/TransactionEntityTransformer'
import { TransactionTypeEntityTransformer } from './transformer/transactionTypeEntityTransformer'

export class DefaultTransactionService implements TransactionService {
  constructor(
    private readonly appSync: ApiClient,
    private readonly transactionWorker: TransactionWorker,
  ) {}

  async getTransaction(
    input: TransactionServiceGetTransactionInput,
  ): Promise<TransactionEntity | undefined> {
    const fetchPolicy = input.cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(input.cachePolicy)
      : undefined
    const sealedTransaction = await this.appSync.getTransaction(
      {
        id: input.id,
      },
      fetchPolicy,
    )
    if (!sealedTransaction) {
      return undefined
    }
    const unsealed =
      await this.transactionWorker.unsealTransaction(sealedTransaction)
    return TransactionEntityTransformer.transform(unsealed)
  }

  async listTransactions(
    input: TransactionServiceListTransactionsInput,
  ): Promise<
    ListOperationResult<TransactionEntity, TransactionSealedAttributes>
  > {
    const fetchPolicy = input.cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(input.cachePolicy)
      : undefined
    const dateRange = input.dateRange
      ? DateRangeTransformer.transformToGraphQLInput(input.dateRange)
      : undefined
    const { items: sealedTransactions, nextToken: newNextToken } =
      await this.appSync.listTransactions(
        {
          limit: input.limit,
          nextToken: input.nextToken,
          dateRange,
          sortOrder: input.sortOrder,
        },
        fetchPolicy,
      )

    return this.unsealTransactions(
      sealedTransactions,
      newNextToken ?? undefined,
    )
  }

  async listTransactionsByCardId(
    input: TransactionServiceListTransactionsByCardIdInput,
  ): Promise<
    ListOperationResult<TransactionEntity, TransactionSealedAttributes>
  > {
    const fetchPolicy = input.cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(input.cachePolicy)
      : undefined
    const dateRange = input.dateRange
      ? DateRangeTransformer.transformToGraphQLInput(input.dateRange)
      : undefined
    const { items: sealedTransactions, nextToken: newNextToken } =
      await this.appSync.listTransactionsByCardId(
        {
          cardId: input.cardId,
          limit: input.limit,
          nextToken: input.nextToken,
          dateRange,
          sortOrder: input.sortOrder,
        },
        fetchPolicy,
      )

    return this.unsealTransactions(
      sealedTransactions,
      newNextToken ?? undefined,
    )
  }

  async listTransactionsByCardIdAndType(
    input: TransactionServiceListTransactionsByCardIdAndTypeInput,
  ): Promise<
    ListOperationResult<TransactionEntity, TransactionSealedAttributes>
  > {
    const fetchPolicy = input.cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(input.cachePolicy)
      : undefined
    const transactionType =
      TransactionTypeEntityTransformer.transformToGraphQLInput(
        input.transactionType,
      )
    const { items: sealedTransactions, nextToken: newNextToken } =
      await this.appSync.listTransactionsByCardIdAndType(
        {
          cardId: input.cardId,
          transactionType: transactionType,
          limit: input.limit,
          nextToken: input.nextToken,
        },
        fetchPolicy,
      )

    return this.unsealTransactions(
      sealedTransactions,
      newNextToken ?? undefined,
    )
  }

  private async unsealTransactions(
    sealedTransactions: SealedTransaction[],
    nextToken: string | undefined,
  ): Promise<
    ListOperationResult<TransactionEntity, TransactionSealedAttributes>
  > {
    const success: TransactionUnsealed[] = []
    const failed: {
      item: Omit<TransactionUnsealed, keyof TransactionSealedAttributes>
      cause: Error
    }[] = []
    const sealedTransactionsById = _.groupBy(sealedTransactions, (t) => t.id)
    for (const sealedTransactions of Object.values(sealedTransactionsById)) {
      // Succeed if we can unseal one of the sealed transactions
      // for this ID and only report failures if we can't unseal any
      // of them
      const failedForId: {
        item: Omit<TransactionUnsealed, keyof TransactionSealedAttributes>
        cause: Error
      }[] = []
      let successForId: TransactionUnsealed | undefined = undefined

      for (const sealed of sealedTransactions) {
        try {
          const unsealed =
            await this.transactionWorker.unsealTransaction(sealed)
          successForId = unsealed
          break
        } catch (e) {
          failedForId.push({ item: sealed, cause: e as Error })
        }
      }

      if (successForId) {
        success.push(successForId)
      } else {
        failed.push(...failedForId)
      }
    }
    if (failed.length) {
      return {
        status: ListOperationResultStatus.Partial,
        nextToken,
        items: success.map(TransactionEntityTransformer.transformSuccess),
        failed: failed.map(({ item, cause }) => ({
          item: TransactionEntityTransformer.transformFailure(item),
          cause,
        })),
      }
    } else {
      return {
        status: ListOperationResultStatus.Success,
        nextToken,
        items: success.map(TransactionEntityTransformer.transformSuccess),
      }
    }
  }
}
