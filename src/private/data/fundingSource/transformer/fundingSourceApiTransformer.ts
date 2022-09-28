import { FatalError } from '@sudoplatform/sudo-common'
import {
  CreditCardFundingSource,
  FundingSource,
} from '../../../../public/typings/fundingSource'
import {
  FundingSourceEntity,
  isCreditCardFundingSourceEntity,
} from '../../../domain/entities/fundingSource/fundingSourceEntity'

export class FundingSourceAPITransformer {
  static transformEntity(entity: FundingSourceEntity): FundingSource {
    const type = entity.type
    if (isCreditCardFundingSourceEntity(entity)) {
      const transformed: CreditCardFundingSource = {
        id: entity.id,
        owner: entity.owner,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        currency: entity.currency,
        type: entity.type,
        last4: entity.last4,
        network: entity.network,
        state: entity.state,
        version: entity.version,
      }
      return transformed
    } else {
      throw new FatalError(`Unrecognized funding source type: ${type}`)
    }
  }
}
