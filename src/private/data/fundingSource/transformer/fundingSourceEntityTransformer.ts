import { CardType, FundingSource } from '../../../../gen/graphqlTypes'
import { CardType as CardTypeEntity } from '../../../../public/typings/cardType'
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
      cardType: CardTypeTransformer.transformGraphQL(data.cardType),
      network: data.network,
      state: data.state,
      version: data.version,
    }
  }
}

export class CardTypeTransformer {
  static transformGraphQL(data: CardType): CardTypeEntity {
    switch (data) {
      case CardType.Credit:
        return CardTypeEntity.Credit
      case CardType.Debit:
        return CardTypeEntity.Debit
      case CardType.Prepaid:
        return CardTypeEntity.Prepaid
      case CardType.Other:
        return CardTypeEntity.Other
    }
  }
}
