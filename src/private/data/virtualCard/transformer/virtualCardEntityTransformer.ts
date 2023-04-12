/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { VirtualCardEntity } from '../../../domain/entities/virtualCard/virtualCardEntity'
import { TransactionEntityTransformer } from '../../transaction/transformer/TransactionEntityTransformer'
import {
  VirtualCardSealedAttributes,
  VirtualCardUnsealed,
} from '../virtualCardSealedAttributes'

export class VirtualCardEntityTransformer {
  static transform(data: VirtualCardUnsealed): VirtualCardEntity {
    return VirtualCardEntityTransformer.transformSuccess(data)
  }

  static transformSuccess(data: VirtualCardUnsealed): VirtualCardEntity {
    return {
      ...VirtualCardEntityTransformer.transformOverlap(data),
      last4: data.last4,
      cardHolder: data.cardHolder,
      alias: data.alias ?? '', // default to empty string until we remove altogether
      pan: data.pan,
      csc: data.csc,
      billingAddress: data.billingAddress,
      expiry: data.expiry,
      lastTransaction: data.lastTransaction
        ? TransactionEntityTransformer.transform(data.lastTransaction)
        : undefined,
      metadata: data.metadata,
    }
  }

  static transformFailure(
    data: Omit<VirtualCardUnsealed, keyof VirtualCardSealedAttributes>,
  ): Omit<VirtualCardEntity, keyof VirtualCardSealedAttributes> {
    return VirtualCardEntityTransformer.transformOverlap(data)
  }

  /**
   * This uses the lowest common denominator to share code between the failure and success transformation.
   */
  private static transformOverlap(
    data: Omit<VirtualCardUnsealed, keyof VirtualCardSealedAttributes>,
  ): Omit<VirtualCardEntity, keyof VirtualCardSealedAttributes> {
    return {
      id: data.id,
      owner: data.owner,
      version: data.version,
      createdAt: new Date(data.createdAtEpochMs),
      updatedAt: new Date(data.updatedAtEpochMs),
      owners: data.owners,
      fundingSourceId: data.fundingSourceId,
      currency: data.currency,
      state: data.state,
      last4: data.last4,
      activeTo: new Date(data.activeToEpochMs),
      cancelledAt: data.cancelledAtEpochMs
        ? new Date(data.cancelledAtEpochMs)
        : undefined,
    }
  }
}
