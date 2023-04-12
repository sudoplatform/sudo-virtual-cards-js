/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransactionType } from '../../../../public/typings/transaction'
import { TransactionEntity } from '../../../domain/entities/transaction/transactionEntity'
import { TransactionUnsealed } from '../../common/transactionWorker'
import { TransactionSealedAttributes } from '../transactionSealedAttributes'

export class TransactionEntityTransformer {
  static transform(data: TransactionUnsealed): TransactionEntity {
    return TransactionEntityTransformer.transformSuccess(data)
  }

  static transformSuccess(data: TransactionUnsealed): TransactionEntity {
    const entity: TransactionEntity = {
      ...TransactionEntityTransformer.transformOverlap(data),
      transactedAt: new Date(data.transactedAtEpochMs),
      billedAmount: data.billedAmount,
      transactedAmount: data.transactedAmount,
      description: data.description,
      declineReason: data.declineReason,
      detail: data.detail,
    }
    if (
      entity.type === TransactionType.Complete ||
      entity.type === TransactionType.Refund
    ) {
      // Before we had settledAt this information was available through sortDate
      entity.settledAt = new Date(data.settledAtEpochMs ?? data.sortDateEpochMs)
    }

    return entity
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
