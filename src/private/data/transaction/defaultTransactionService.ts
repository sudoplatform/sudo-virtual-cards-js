import {
  ListOperationResult,
  ListOperationResultStatus,
} from '@sudoplatform/sudo-common'
import _ from 'lodash'
import { DeclineReason } from '../../..'
import {
  CurrencyAmountEntity,
  MarkupEntity,
  TransactionEntity,
} from '../../domain/entities/transaction/transactionEntity'
import {
  TransactionService,
  TransactionServiceGetTransactionInput,
  TransactionServiceListTransactionsByCardIdInput,
} from '../../domain/entities/transaction/transactionService'
import { ApiClient } from '../common/apiClient'
import {
  TransactionUnsealed,
  TransactionWorker,
} from '../common/transactionWorker'
import { DateRangeTransformer } from '../common/transformer/dateRangeTransformer'
import { FetchPolicyTransformer } from '../common/transformer/fetchPolicyTransformer'
import { TransactionEntityTransformer } from './transformer/TransactionEntityTransformer'

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
    const unsealed = await this.transactionWorker.unsealTransaction(
      sealedTransaction,
    )
    return TransactionEntityTransformer.transform(unsealed)
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
    const success: TransactionUnsealed[] = []
    const failed: {
      item: Omit<TransactionUnsealed, keyof TransactionSealedAttributes>
      cause: Error
    }[] = []
    const sealedTransactionsById = _.groupBy(sealedTransactions, (t) => t.id)
    for (const sealedTransactions of Object.values(sealedTransactionsById)) {
      for (const sealed of sealedTransactions) {
        try {
          const unsealed = await this.transactionWorker.unsealTransaction(
            sealed,
          )
          success.push(unsealed)
        } catch (e) {
          failed.push({ item: sealed, cause: e as Error })
        }
      }
    }
    if (failed.length) {
      return {
        status: ListOperationResultStatus.Partial,
        nextToken: newNextToken ?? undefined,
        items: success.map(TransactionEntityTransformer.transformSuccess),
        failed: failed.map(({ item, cause }) => ({
          item: TransactionEntityTransformer.transformFailure(item),
          cause,
        })),
      }
    } else {
      return {
        status: ListOperationResultStatus.Success,
        nextToken: newNextToken ?? undefined,
        items: success.map(TransactionEntityTransformer.transformSuccess),
      }
    }
  }
}
