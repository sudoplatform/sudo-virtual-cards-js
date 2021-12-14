import { DefaultLogger, NotSignedInError } from '@sudoplatform/sudo-common'
import { CreditCardNetwork, FundingSourceState } from '../../../..'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'

interface CompleteFundingSourceUseCaseInput {
  id: string
  completionData: { provider: string; version: number; paymentMethod: string }
}

interface CompleteFundingSourceUseCaseOutput {
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

export enum FundingSourceType {
  CreditCard = 'CREDIT_CARD',
}

export class CompleteFundingSourceUseCase {
  private readonly log = new DefaultLogger(this.constructor.name)

  public constructor(
    private readonly fundingSourceService: FundingSourceService,
    private readonly userService: SudoUserService,
  ) {}

  async execute(
    input: CompleteFundingSourceUseCaseInput,
  ): Promise<CompleteFundingSourceUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.fundingSourceService.completeFundingSource(input)
  }
}
