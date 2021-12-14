import { FundingSource } from '../../../..'
import { FundingSourceEntity } from '../../../domain/entities/fundingSource/fundingSourceEntity'

export class FundingSourceAPITransformer {
  static transformEntity(entity: FundingSourceEntity): FundingSource {
    const transformed: FundingSource = {
      id: entity.id,
      owner: entity.owner,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      currency: entity.currency,
      last4: entity.last4,
      network: entity.network,
      state: entity.state,
      version: entity.version,
    }
    return transformed
  }
}
