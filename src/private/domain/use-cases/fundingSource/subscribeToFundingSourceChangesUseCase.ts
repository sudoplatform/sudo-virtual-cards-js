import {
  DefaultLogger,
  Logger,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { FundingSourceChangeSubscriber } from '../../../../public/typings/fundingSource'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'

interface SubscribeToFundingSourceChangesUseCaseInput {
  id: string
  subscriber: FundingSourceChangeSubscriber
}

/**
 * Application business logic for subscribing to changes in funding sources.
 * Specify a unique id for the subscriber.
 */
export class SubscribeToFundingSourceChangesUseCase {
  private readonly log: Logger

  public constructor(
    private readonly fundingSourceService: FundingSourceService,
    private readonly sudoUserClient: SudoUserClient,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

  async execute(
    input: SubscribeToFundingSourceChangesUseCaseInput,
  ): Promise<void> {
    this.log.debug(this.constructor.name, {
      input,
    })
    const owner = await this.sudoUserClient.getSubject()
    if (!owner) {
      throw new NotSignedInError()
    }
    this.fundingSourceService.subscribeToFundingSourceChanges({
      ...input,
      owner,
    })
  }
}
