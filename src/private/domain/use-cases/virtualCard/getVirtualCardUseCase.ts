import { CachePolicy, NotSignedInError } from '@sudoplatform/sudo-common'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { VirtualCardService } from '../../entities/virtualCard/virtualCardService'
import { VirtualCardUseCaseOutput } from './outputs'

export interface GetVirtualCardUseCaseInput {
  id: string
  cachePolicy: CachePolicy
}

export type GetVirtualCardUseCaseOutput = VirtualCardUseCaseOutput

export class GetVirtualCardUseCase {
  constructor(
    private readonly virtualCardService: VirtualCardService,
    private readonly userService: SudoUserService,
  ) {}

  async execute(
    input: GetVirtualCardUseCaseInput,
  ): Promise<GetVirtualCardUseCaseOutput | undefined> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.virtualCardService.getVirtualCard(input)
  }
}
