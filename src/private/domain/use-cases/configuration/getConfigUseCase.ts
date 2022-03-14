import { DefaultLogger, NotSignedInError } from '@sudoplatform/sudo-common'
import { FundingSourceSupportInfo } from '../../../..'
import { VirtualCardsConfigService } from '../../entities/configuration/virtualCardsConfigService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { CurrencyAmountEntity } from '../../entities/transaction/transactionEntity'

export interface CurrencyVelocityEntity {
  currency: string
  velocity: string[]
}

export interface VirtualCardsConfigUseCaseOutput {
  maxFundingSourceVelocity: string[]
  maxFundingSourceFailureVelocity: string[]
  maxCardCreationVelocity: string[]
  maxTransactionVelocity: CurrencyVelocityEntity[]
  maxTransactionAmount: CurrencyAmountEntity[]
  virtualCardCurrencies: string[]
  fundingSourceSupportInfo: FundingSourceSupportInfo[]
}

/**
 * Application business logic for retrieving configuration data.
 */
export class GetVirtualCardsConfigUseCase {
  private readonly log = new DefaultLogger(this.constructor.name)

  public constructor(
    private readonly configurationDataService: VirtualCardsConfigService,
    private readonly userService: SudoUserService,
  ) {}

  async execute(): Promise<VirtualCardsConfigUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }

    this.log.debug(this.constructor.name)
    return await this.configurationDataService.getVirtualCardsConfig()
  }
}
