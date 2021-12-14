import {
  CachePolicy,
  DefaultLogger,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import { CreditCardNetwork, FundingSourceState } from '../../../..'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'

/**
 * Input for {@link GetFundingSourceUseCase}.
 *
 * @interface GetFundingSourceInput
 * @property {string} id The identifier of the funding source to attempt to retrieve.
 * @property {CachePolicy} cachePolicy Cache policy determines the strategy for accessing the funding source record.
 */
interface GetFundingSourceUseCaseInput {
  id: string
  cachePolicy: CachePolicy
}

interface GetFundingSourceUseCaseOutput {
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

/**
 * Application business logic for retrieving a funding source.
 */
export class GetFundingSourceUseCase {
  private readonly log = new DefaultLogger(this.constructor.name)
  constructor(
    private readonly fundingSourceService: FundingSourceService,
    private readonly userService: SudoUserService,
  ) {}

  async execute({
    id,
    cachePolicy,
  }: GetFundingSourceUseCaseInput): Promise<
    GetFundingSourceUseCaseOutput | undefined
  > {
    this.log.debug(this.constructor.name, {
      id,
      cachePolicy,
    })
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.fundingSourceService.getFundingSource({
      id,
      cachePolicy,
    })
  }
}
