import {
  EncryptionAlgorithm,
  FatalError,
  UnrecognizedAlgorithmError,
} from '@sudoplatform/sudo-common'
import {
  SealedCurrencyAmountAttribute,
  SealedTransaction,
  SealedTransactionDetailChargeAttribute,
} from '../../../gen/graphqlTypes'
import {
  DeclineReason,
  TransactionType,
} from '../../../public/typings/transaction'
import {
  CurrencyAmountEntity,
  MarkupEntity,
  TransactionDetailChargeEntity,
} from '../../domain/entities/transaction/transactionEntity'
import { DeviceKeyWorker, KeyType } from './deviceKeyWorker'

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
  settledAtEpochMs?: number
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

export interface TransactionWorker {
  unsealTransaction(
    sealedTransaction: SealedTransaction,
  ): Promise<TransactionUnsealed>
}

export class DefaultTransactionWorker implements TransactionWorker {
  public constructor(private readonly deviceKeyWorker: DeviceKeyWorker) {}

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
        },
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
      settledAtEpochMs: transaction.settledAtEpochMs
        ? await unsealNumber(transaction.settledAtEpochMs, 'settledAtEpochMs')
        : undefined,
      declineReason: transaction.declineReason
        ? await unsealDeclineReason(transaction.declineReason)
        : undefined,
      detail: transactionDetail,
    }
  }
}
