import {
  FundingSourceType,
  ProvisionalFundingSourceState,
} from '../../../../public/typings/fundingSource'

export interface ProvisionalFundingSourceEntity {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  type: FundingSourceType
  state: ProvisionalFundingSourceState
  provisioningData: string
}
