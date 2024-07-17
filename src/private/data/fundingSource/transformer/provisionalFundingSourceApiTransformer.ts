/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProvisionalFundingSource } from '../../../../public/typings/fundingSource'
import { ProvisionalFundingSourceEntity } from '../../../domain/entities/fundingSource/provisionalFundingSourceEntity'
import { decodeProvisionalFundingSourceProvisioningData } from '../../fundingSourceProviderData/provisioningData'

export class ProvisionalFundingSourceApiTransformer {
  static transformEntity(
    entity: ProvisionalFundingSourceEntity,
  ): ProvisionalFundingSource {
    const provisioningData = decodeProvisionalFundingSourceProvisioningData(
      entity.provisioningData,
    )

    return {
      id: entity.id,
      owner: entity.owner,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      state: entity.state,
      type: entity.type,
      last4: entity.last4,
      provisioningData,
    }
  }
}
