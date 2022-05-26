import {
  CachePolicy,
  ListOperationResult,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import { ProvisioningState } from '../../../..'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { VirtualCardService } from '../../entities/virtualCard/virtualCardService'
import { VirtualCardUseCaseOutput } from './outputs'

export interface ListProvisionalCardsUseCaseInput {
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
}

export interface ListProvisionalCardsProvisionalCardOutput {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  clientRefId: string
  provisioningState: ProvisioningState
  card: VirtualCardUseCaseOutput | undefined
}

export type ListProvisionalCardsUseCaseOutput =
  ListOperationResult<ListProvisionalCardsProvisionalCardOutput>

export class ListProvisionalCardsUseCase {
  constructor(
    private readonly virtualCardService: VirtualCardService,
    private readonly userService: SudoUserService,
  ) {}

  async execute(
    input?: ListProvisionalCardsUseCaseInput,
  ): Promise<ListProvisionalCardsUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.virtualCardService.listProvisionalCards(input)
  }
}
