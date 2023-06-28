import {
  DefaultLogger,
  Logger,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import {
  FundingSource,
  SandboxSetFundingSourceToRequireRefreshInput,
} from '../../../../public'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'

export class SandboxSetFundingSourceToRequireRefreshUseCase {
  private readonly log: Logger

  public constructor(
    private readonly fundingSourceService: FundingSourceService,
    private readonly userService: SudoUserService,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

  async execute(
    input: SandboxSetFundingSourceToRequireRefreshInput,
  ): Promise<FundingSource> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }

    this.log.info('Sandbox: Setting funding source to refresh state', { input })

    return await this.fundingSourceService.sandboxSetFundingSourceToRequireRefresh(
      input,
    )
  }
}
