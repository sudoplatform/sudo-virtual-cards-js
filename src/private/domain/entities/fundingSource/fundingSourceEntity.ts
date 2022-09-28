import {
  CreditCardNetwork,
  FundingSourceState,
  FundingSourceType,
} from '../../../../public/typings/fundingSource'

export interface FundingSourceClientConfigurationEntity {
  data: string
}

export interface BaseFundingSourceEntity {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  state: FundingSourceState
  type: FundingSourceType
  currency: string
}
export interface CreditCardFundingSourceEntity extends BaseFundingSourceEntity {
  type: FundingSourceType.CreditCard
  last4: string
  network: CreditCardNetwork
}

export type FundingSourceEntity = CreditCardFundingSourceEntity

export function isCreditCardFundingSourceEntity(
  e: FundingSourceEntity,
): e is CreditCardFundingSourceEntity {
  return e.type === FundingSourceType.CreditCard
}
