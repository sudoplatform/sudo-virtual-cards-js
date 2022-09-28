import {
  DefaultLogger,
  Logger,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import {
  CreditCardNetwork,
  FundingSourceState,
} from '../../../../public/typings/fundingSource'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { FundingSourceType } from './completeFundingSourceUseCase'

interface BaseCancelFundingSourceUseCaseOutput {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  state: FundingSourceState
  currency: string
}

interface CancelCreditCardFundingSourceUseCaseOutput
  extends BaseCancelFundingSourceUseCaseOutput {
  type: FundingSourceType.CreditCard
  last4: string
  network: CreditCardNetwork
}

type CancelFundingSourceUseCaseOutput =
  CancelCreditCardFundingSourceUseCaseOutput

/**
 * Application business logic for cancelling a funding source.
 */
export class CancelFundingSourceUseCase {
  private readonly log: Logger

  public constructor(
    private readonly fundingSourceService: FundingSourceService,
    private readonly userService: SudoUserService,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

  async execute(id: string): Promise<CancelFundingSourceUseCaseOutput> {
    this.log.debug(this.constructor.name, {
      id,
    })
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.fundingSourceService.cancelFundingSource({ id })
  }
}
