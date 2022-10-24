import { ProvisionalFundingSource } from '../../../../gen/graphqlTypes'
import { ProvisionalFundingSourceEntity } from '../../../domain/entities/fundingSource/provisionalFundingSourceEntity'
import { decodeProvisionalFundingSourceProvisioningData } from '../../fundingSourceProviderData/provisioningData'

export class ProvisionalFundingSourceEntityTransformer {
  static transformGraphQL(
    data: ProvisionalFundingSource,
  ): ProvisionalFundingSourceEntity {
    const provisioningData = decodeProvisionalFundingSourceProvisioningData(
      data.provisioningData,
    )
    return {
      id: data.id,
      owner: data.owner,
      version: data.version,
      createdAt: new Date(data.createdAtEpochMs),
      updatedAt: new Date(data.updatedAtEpochMs),
      state: data.state,
      type: provisioningData.type,
      provisioningData: data.provisioningData,
    }
  }
}
