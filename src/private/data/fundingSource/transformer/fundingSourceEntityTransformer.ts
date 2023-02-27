import { FatalError } from '@sudoplatform/sudo-common'
import {
  BankAccountType,
  CardType,
  TransactionVelocity,
} from '../../../../gen/graphqlTypes'
import { BankAccountType as BankAccountTypeEntity } from '../../../../public/typings/bankAccountType'
import { CardType as CardTypeEntity } from '../../../../public/typings/cardType'
import { FundingSourceType } from '../../../../public/typings/fundingSource'
import { TransactionVelocity as TransactionVelocityEntity } from '../../../../public/typings/transactionVelocity'
import { FundingSourceEntity } from '../../../domain/entities/fundingSource/fundingSourceEntity'
import { FundingSourceUnsealed } from '../fundingSourceSealedAttributes'

export class FundingSourceEntityTransformer {
  static transformGraphQL(data: FundingSourceUnsealed): FundingSourceEntity {
    const commonProps = {
      id: data.id,
      owner: data.owner,
      createdAt: new Date(data.createdAtEpochMs),
      updatedAt: new Date(data.updatedAtEpochMs),
      currency: data.currency,
      state: data.state,
      version: data.version,
      transactionVelocity: TransactionVelocityTransformer.transformGraphQL(
        data.transactionVelocity,
      ),
    }
    switch (data.__typename) {
      case 'CreditCardFundingSource':
        return {
          ...commonProps,
          type: FundingSourceType.CreditCard,
          last4: data.last4,
          cardType: CardTypeTransformer.transformGraphQL(data.cardType),
          network: data.network,
        }
      case 'BankAccountFundingSource':
        return {
          ...commonProps,
          type: FundingSourceType.BankAccount,
          bankAccountType: BankAccountTypeTransformer.transformGraphQL(
            data.bankAccountType,
          ),
          last4: data.last4,
          institutionName: data.institutionName,
          institutionLogo: data.institutionLogo,
        }
      default:
        throw new FatalError('Unrecognized funding source type')
    }
  }
}

export class TransactionVelocityTransformer {
  static transformGraphQL(
    data?: TransactionVelocity | null,
  ): TransactionVelocityEntity | undefined {
    const maximum = data?.maximum ?? undefined
    const velocity = data?.velocity ?? undefined

    if (maximum === undefined && velocity === undefined) {
      return undefined
    }

    return {
      maximum,
      velocity,
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

export class BankAccountTypeTransformer {
  static transformGraphQL(data: BankAccountType): BankAccountTypeEntity {
    switch (data) {
      case BankAccountType.Checking:
        return BankAccountTypeEntity.Checking
      case BankAccountType.Savings:
        return BankAccountTypeEntity.Savings
      case BankAccountType.Other:
        return BankAccountTypeEntity.Other
    }
  }
}
