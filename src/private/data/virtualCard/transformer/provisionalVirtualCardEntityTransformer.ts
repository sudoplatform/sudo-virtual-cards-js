/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProvisionalVirtualCardEntity } from '../../../domain/entities/virtualCard/provisionalVirtualCardEntity'
import { ProvisionalCardUnsealed } from '../virtualCardSealedAttributes'
import { VirtualCardEntityTransformer } from './virtualCardEntityTransformer'

export class ProvisionalVirtualCardEntityTransformer {
  static transform(
    data: ProvisionalCardUnsealed,
  ): ProvisionalVirtualCardEntity {
    return {
      ...ProvisionalVirtualCardEntityTransformer.transformOverlap(data),
      card: data.card
        ? VirtualCardEntityTransformer.transform(data.card)
        : undefined,
    }
  }

  static transformSuccess(
    data: ProvisionalCardUnsealed,
  ): ProvisionalVirtualCardEntity {
    return ProvisionalVirtualCardEntityTransformer.transform(data)
  }

  static transformFailure(
    data: Omit<ProvisionalCardUnsealed, 'card'>,
  ): Omit<ProvisionalVirtualCardEntity, 'card'> {
    return ProvisionalVirtualCardEntityTransformer.transformOverlap(data)
  }

  private static transformOverlap(
    data: Omit<ProvisionalCardUnsealed, 'card'>,
  ): Omit<ProvisionalVirtualCardEntity, 'card'> {
    return {
      id: data.id,
      owner: data.owner,
      version: data.version,
      createdAt: new Date(data.createdAtEpochMs),
      updatedAt: new Date(data.updatedAtEpochMs),
      clientRefId: data.clientRefId,
      provisioningState: data.provisioningState,
    }
  }
}
