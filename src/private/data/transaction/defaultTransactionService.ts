import {
  EncryptionAlgorithm,
  FatalError,
  ListOperationResult,
  ListOperationResultStatus,
  UnrecognizedAlgorithmError,
} from '@sudoplatform/sudo-common'
import _ from 'lodash'
import { DeclineReason, TransactionType } from '../../..'
import {
  SealedCurrencyAmountAttribute,
  SealedTransaction,
  SealedTransactionDetailChargeAttribute,
} from '../../../gen/graphqlTypes'
import {
  CurrencyAmountEntity,
  MarkupEntity,
  TransactionDetailChargeEntity,
  TransactionEntity,
} from '../../domain/entities/transaction/transactionEntity'
import {
  TransactionService,
  TransactionServiceGetTransactionInput,
  TransactionServiceListTransactionsByCardIdInput,
} from '../../domain/entities/transaction/transactionService'
import { ApiClient } from '../common/apiClient'
import { DeviceKeyWorker, KeyType } from '../common/deviceKeyWorker'
import { DateRangeTransformer } from '../common/transformer/dateRangeTransformer'
import { FetchPolicyTransformer } from '../common/transformer/fetchPolicyTransformer'
import { TransactionEntityTransformer } from './transformer/TransactionEntityTransformer'

export interface TransactionUnsealed {
  id: string
  owner: string
  version: number
  createdAtEpochMs: number
  updatedAtEpochMs: number
  sortDateEpochMs: number
  cardId: string
  sequenceId: string
  type: TransactionType
  billedAmount: CurrencyAmountEntity
  transactedAmount: CurrencyAmountEntity
  description: string
  transactedAtEpochMs: number
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

export interface TransactionSealedAttributes {
  billedAmount: CurrencyAmountEntity
  transactedAmount: CurrencyAmountEntity
  description: string
  transactedAtEpochMs: undefined
  transactedAt: Date
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
    private readonly deviceKeyWorker: DeviceKeyWorker,
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
    const unsealed = await this.unsealTransaction(sealedTransaction)
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
          filter: input.filter,
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
          const unsealed = await this.unsealTransaction(sealed)
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

  async unsealTransaction(
    transaction: SealedTransaction,
  ): Promise<TransactionUnsealed> {
    let algorithm: EncryptionAlgorithm
    switch (transaction.algorithm) {
      case 'AES/CBC/PKCS7Padding':
        algorithm = EncryptionAlgorithm.AesCbcPkcs7Padding
        break
      case 'RSAEncryptionOAEPAESCBC':
        algorithm = EncryptionAlgorithm.RsaOaepSha1
        break
      default:
        throw new UnrecognizedAlgorithmError(
          `Encryption Algorithm not supported: ${transaction.algorithm}`,
        )
    }
    const unseal = async (encrypted: string): Promise<string> => {
      return await this.deviceKeyWorker.unsealString({
        encrypted,
        keyId: transaction.keyId,
        keyType: KeyType.PrivateKey,
        algorithm,
      })
    }
    const unsealNumber = async (
      encrypted: string,
      name?: string,
    ): Promise<number> => {
      const unsealed = await unseal(encrypted)
      const numUnsealed = parseInt(unsealed)
      if (numUnsealed === NaN) {
        throw new FatalError(
          `Invalid data when unsealing an expected number - property: ${
            name ?? 'unknown'
          }`,
        )
      }
      return numUnsealed
    }
    const unsealCurrencyAmount = async (
      encrypted: SealedCurrencyAmountAttribute,
    ): Promise<CurrencyAmountEntity> => {
      return {
        currency: await unseal(encrypted.currency),
        amount: await unsealNumber(encrypted.amount, 'amount'),
      }
    }
    const unsealDeclineReason = async (
      encrypted: string,
    ): Promise<DeclineReason> => {
      const unsealed = await unseal(encrypted)
      for (const val of Object.values(DeclineReason)) {
        if (unsealed === val) {
          return val
        }
      }
      throw new FatalError(`Unsupported Decline Reason: ${unsealed}`)
    }
    const unsealDetail = async (
      encrypted: SealedTransactionDetailChargeAttribute,
    ): Promise<TransactionDetailChargeEntity> => {
      return {
        virtualCardAmount: await unsealCurrencyAmount(
          encrypted.virtualCardAmount,
        ),
        markup: {
          percent: await unsealNumber(
            encrypted.markup.percent,
            'markup.percent',
          ),
          flat: await unsealNumber(encrypted.markup.flat, 'markup.flat'),
          minCharge: encrypted.markup.minCharge
            ? await unsealNumber(encrypted.markup.minCharge, 'markup.minCharge')
            : undefined,
        }, //
        markupAmount: await unsealCurrencyAmount(encrypted.markupAmount),
        fundingSourceAmount: await unsealCurrencyAmount(
          encrypted.fundingSourceAmount,
        ),
        fundingSourceId: encrypted.fundingSourceId,
        description: await unseal(encrypted.description),
      }
    }
    let transactionDetail: TransactionDetailChargeEntity[] | undefined
    if (transaction.detail) {
      transactionDetail = await Promise.all(
        transaction.detail.map(async (d) => {
          return await unsealDetail(d)
        }),
      )
    }
    return {
      id: transaction.id,
      owner: transaction.owner,
      version: transaction.version,
      createdAtEpochMs: transaction.createdAtEpochMs,
      updatedAtEpochMs: transaction.updatedAtEpochMs,
      sortDateEpochMs: transaction.sortDateEpochMs,
      cardId: transaction.cardId,
      sequenceId: transaction.sequenceId,
      type: transaction.type,
      billedAmount: await unsealCurrencyAmount(transaction.billedAmount),
      transactedAmount: await unsealCurrencyAmount(
        transaction.transactedAmount,
      ),
      description: await unseal(transaction.description),
      transactedAtEpochMs: await unsealNumber(
        transaction.transactedAtEpochMs,
        'transactedAtEpochMs',
      ),
      declineReason: transaction.declineReason
        ? await unsealDeclineReason(transaction.declineReason)
        : undefined,
      detail: transactionDetail,
    }
  }
}
