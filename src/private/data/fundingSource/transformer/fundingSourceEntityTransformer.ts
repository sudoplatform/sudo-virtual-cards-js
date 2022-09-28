import { FundingSource } from '../../../../gen/graphqlTypes'
import { FundingSourceType } from '../../../../public/typings/fundingSource'
import { FundingSourceEntity } from '../../../domain/entities/fundingSource/fundingSourceEntity'

export class FundingSourceEntityTransformer {
  static transformGraphQL(data: FundingSource): FundingSourceEntity {
    return {
      id: data.id,
      owner: data.owner,
      createdAt: new Date(data.createdAtEpochMs),
      updatedAt: new Date(data.updatedAtEpochMs),
      type: FundingSourceType.CreditCard,
      currency: data.currency,
      last4: data.last4,
      network: data.network,
      state: data.state,
      version: data.version,
    }
  }
}
