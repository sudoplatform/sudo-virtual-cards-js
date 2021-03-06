import { NotSignedInError } from '@sudoplatform/sudo-common'
import { ProvisionalFundingSourceState, StateReason } from '../../../..'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'

export enum FundingSourceType {
  CreditCard = 'CREDIT_CARD',
}

interface SetupFundingSourceUseCaseInput {
  type: FundingSourceType
  currency: string
}

interface SetupFundingSourceUseCaseOutput {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  state: ProvisionalFundingSourceState
  stateReason: StateReason
  provisioningData: string
}

export class SetupFundingSourceUseCase {
  constructor(
    private readonly fundingSourceService: FundingSourceService,
    private readonly userService: SudoUserService,
  ) {}

  async execute({
    type,
    currency,
  }: SetupFundingSourceUseCaseInput): Promise<SetupFundingSourceUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.fundingSourceService.setupFundingSource({
      type,
      currency,
    })
  }
}
