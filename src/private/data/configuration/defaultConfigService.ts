/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { VirtualCardsConfigEntity } from '../../domain/entities/configuration/virtualCardsConfigEntity'
import { VirtualCardsConfigService } from '../../domain/entities/configuration/virtualCardsConfigService'
import { ApiClient } from '../common/apiClient'
import { VirtualCardsConfigEntityTransformer } from './transformer/virtualCardsConfigEntityTransformer'

export class DefaultVirtualCardsConfigService
  implements VirtualCardsConfigService
{
  constructor(private readonly appSync: ApiClient) {}

  async getVirtualCardsConfig(): Promise<VirtualCardsConfigEntity> {
    const result = await this.appSync.getVirtualCardsConfig()
    return VirtualCardsConfigEntityTransformer.transformGraphQL(result)
  }
}
