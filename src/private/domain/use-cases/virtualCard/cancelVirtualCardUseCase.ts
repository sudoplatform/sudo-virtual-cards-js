/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { NotSignedInError } from '@sudoplatform/sudo-common'
import { APIResult } from '../../../../public/typings/apiResult'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { VirtualCardService } from '../../entities/virtualCard/virtualCardService'
import {
  VirtualCardSealedAttributesUseCaseOutput,
  VirtualCardUseCaseOutput,
} from './outputs'

interface CancelVirtualCardUseCaseInput {
  id: string
}

type CancelVirtualCardUseCaseOutput = APIResult<
  VirtualCardUseCaseOutput,
  VirtualCardSealedAttributesUseCaseOutput
>

export class CancelVirtualCardUseCase {
  constructor(
    private readonly virtualCardService: VirtualCardService,
    private readonly userService: SudoUserService,
  ) {}

  async execute(
    input: CancelVirtualCardUseCaseInput,
  ): Promise<CancelVirtualCardUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.virtualCardService.cancelVirtualCard(input)
  }
}
