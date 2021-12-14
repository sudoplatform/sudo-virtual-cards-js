import { CreditCardFundingSource } from '../../../../gen/graphqlTypes'
import { FundingSourceEntity } from '../../../domain/entities/fundingSource/fundingSourceEntity'

export class FundingSourceEntityTransformer {
  static transformGraphQL(data: CreditCardFundingSource): FundingSourceEntity {
    return {
      id: data.id,
      owner: data.owner,
      createdAt: new Date(data.createdAtEpochMs),
      updatedAt: new Date(data.updatedAtEpochMs),
      currency: data.currency,
      last4: data.last4,
      network: data.network,
      state: data.state,
      version: data.version,
    }
  }
}
