import { CurrencyAmountEntity } from '../../../domain/entities/transaction/transactionEntity'
import { CurrencyAmount } from '../../../../public'
import { CurrencyAmount as CurrencyAmountGraphQL } from '../../../../gen/graphqlTypes'

export class CurrencyAmountTransformer {
  public static transformToCurrencyAmount(
    entity: CurrencyAmountEntity,
  ): CurrencyAmount {
    return {
      currency: entity.currency,
      amount: Number(entity.amount),
    }
  }
  public static transformToCurrencyAmountEntity(
    model: CurrencyAmountGraphQL,
  ): CurrencyAmountEntity {
    return {
      currency: model.currency,
      amount: Number(model.amount),
    }
  }
}
