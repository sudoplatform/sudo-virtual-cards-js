import {
  CachePolicy,
  ListOperationResult,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import { ProvisionalCardFilter } from '../../../..'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { VirtualCardService } from '../../entities/virtualCard/virtualCardService'
import {
  VirtualCardSealedAttributesUseCaseOutput,
  VirtualCardUseCaseOutput,
} from './outputs'

export interface ListVirtualCardsUseCaseInput {
  filter?: ProvisionalCardFilter
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
}

export type ListVirtualCardsUseCaseOutput = ListOperationResult<
  VirtualCardUseCaseOutput,
  VirtualCardSealedAttributesUseCaseOutput
>

export class ListVirtualCardsUseCase {
  constructor(
    private readonly virtualCardService: VirtualCardService,
    private readonly userService: SudoUserService,
  ) {}

  async execute(
    input?: ListVirtualCardsUseCaseInput,
  ): Promise<ListVirtualCardsUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.virtualCardService.listVirtualCards(input)
  }
}
