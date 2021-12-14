import { CreditCardNetwork, FundingSourceState } from '../../../..'

export interface FundingSourceClientConfigurationEntity {
  data: string
}

export interface FundingSourceEntity {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  state: FundingSourceState
  currency: string
  last4: string
  network: CreditCardNetwork
}
