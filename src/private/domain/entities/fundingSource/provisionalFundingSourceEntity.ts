import { ProvisionalFundingSourceState, StateReason } from '../../../..'

export interface ProvisionalFundingSourceEntity {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  state: ProvisionalFundingSourceState
  stateReason: StateReason
  provisioningData: string
}
