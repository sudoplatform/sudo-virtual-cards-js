import { VirtualCardsConfigEntity } from '../../domain/entities/configuration/virtualCardsConfigEntity'
import { VirtualCardsConfigService } from '../../domain/entities/configuration/virtualCardsConfigService'
import { ApiClient } from '../common/apiClient'
import { VirtualCardsConfigEntityTransformer } from './transformer/configEntityTransformer'

export class DefaultVirtualCardsConfigService
  implements VirtualCardsConfigService
{
  constructor(private readonly appSync: ApiClient) {}

  async getVirtualCardsConfig(): Promise<VirtualCardsConfigEntity> {
    const result = await this.appSync.getVirtualCardsConfig()
    return VirtualCardsConfigEntityTransformer.transformGraphQL(result)
  }
}
