/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CachePolicy,
  ListOperationResult,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { VirtualCardService } from '../../entities/virtualCard/virtualCardService'
import {
  VirtualCardSealedAttributesUseCaseOutput,
  VirtualCardUseCaseOutput,
} from './outputs'
import { SortOrder, VirtualCardFilterInput } from '../../../../public'

export interface ListVirtualCardsUseCaseInput {
  filterInput?: VirtualCardFilterInput
  sortOrder?: SortOrder
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
