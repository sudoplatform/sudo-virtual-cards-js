import { TransactionEntity } from '../../../domain/entities/transaction/transactionEntity'
import { TransactionUnsealed } from '../../common/transactionWorker'
import { TransactionSealedAttributes } from '../defaultTransactionService'

export class TransactionEntityTransformer {
  static transform(data: TransactionUnsealed): TransactionEntity {
    return TransactionEntityTransformer.transformSuccess(data)
  }

  static transformSuccess(data: TransactionUnsealed): TransactionEntity {
    return {
      ...TransactionEntityTransformer.transformOverlap(data),
      transactedAt: new Date(data.transactedAtEpochMs),
      billedAmount: data.billedAmount,
      transactedAmount: data.transactedAmount,
      description: data.description,
      declineReason: data.declineReason,
      detail: data.detail,
    }
  }

  static transformFailure(
    data: Omit<TransactionUnsealed, keyof TransactionSealedAttributes>,
  ): Omit<TransactionEntity, keyof TransactionSealedAttributes> {
    return TransactionEntityTransformer.transformOverlap(data)
  }

  static transformOverlap(
    data: Omit<TransactionUnsealed, keyof TransactionSealedAttributes>,
  ): Omit<TransactionEntity, keyof TransactionSealedAttributes> {
    return {
      id: data.id,
      owner: data.owner,
      version: data.version,
      createdAt: new Date(data.createdAtEpochMs),
      updatedAt: new Date(data.updatedAtEpochMs),
      cardId: data.cardId,
      sequenceId: data.sequenceId,
      type: data.type,
    }
  }
}
