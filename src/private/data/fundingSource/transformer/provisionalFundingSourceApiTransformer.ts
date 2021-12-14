import { Base64 } from '@sudoplatform/sudo-common'
import { ProvisionalFundingSource } from '../../../..'
import { ProvisionalFundingSourceEntity } from '../../../domain/entities/fundingSource/provisionalFundingSourceEntity'

interface StripeProvisionalFundingSourceProvisioningData {
  version: number
  provider: 'stripe'
  client_secret: string
  intent: string
}

export class ProvisionalFundingSourceApiTransformer {
  static transformEntity(
    entity: ProvisionalFundingSourceEntity,
  ): ProvisionalFundingSource {
    const provisioningData = JSON.parse(
      Base64.decodeString(entity.provisioningData),
    ) as StripeProvisionalFundingSourceProvisioningData
    return {
      id: entity.id,
      owner: entity.owner,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      state: entity.state,
      stateReason: entity.stateReason,
      provisioningData: {
        version: provisioningData.version,
        provider: provisioningData.provider,
        clientSecret: provisioningData.client_secret,
        intent: provisioningData.intent,
      },
    }
  }
}
