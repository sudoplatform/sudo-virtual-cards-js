import { CachePolicy, NotSignedInError } from '@sudoplatform/sudo-common'
import { ProvisioningState } from '../../../..'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { VirtualCardService } from '../../entities/virtualCard/virtualCardService'
import { VirtualCardUseCaseOutput } from './outputs'

export interface GetProvisionalCardUseCaseInput {
  id: string
  cachePolicy?: CachePolicy
}

export interface GetProvisionalCardUseCaseOutput {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  clientRefId: string
  provisioningState: ProvisioningState
  card: VirtualCardUseCaseOutput | undefined
}

export class GetProvisionalCardUseCase {
  constructor(
    private readonly virtualCardService: VirtualCardService,
    private readonly userService: SudoUserService,
  ) {}

  async execute(
    input: GetProvisionalCardUseCaseInput,
  ): Promise<GetProvisionalCardUseCaseOutput | undefined> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.virtualCardService.getProvisionalCard(input)
  }
}
