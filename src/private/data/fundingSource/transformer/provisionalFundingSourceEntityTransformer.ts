import { ProvisionalFundingSource } from '../../../../gen/graphqlTypes'
import { FundingSourceType } from '../../../../public/typings/fundingSource'
import { ProvisionalFundingSourceEntity } from '../../../domain/entities/fundingSource/provisionalFundingSourceEntity'

export class ProvisionalFundingSourceEntityTransformer {
  static transformGraphQL(
    data: ProvisionalFundingSource,
  ): ProvisionalFundingSourceEntity {
    return {
      id: data.id,
      owner: data.owner,
      version: data.version,
      createdAt: new Date(data.createdAtEpochMs),
      updatedAt: new Date(data.updatedAtEpochMs),
      state: data.state,
      type: FundingSourceType.CreditCard,
      provisioningData: data.provisioningData,
    }
  }
}
