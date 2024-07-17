/*
 * Copyright © 2024 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DefaultLogger,
  Logger,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { ProvisionalFundingSourceEntity } from '../../entities/fundingSource/provisionalFundingSourceEntity'

/**
 * Application business logic for cancelling a provisional funding source.
 */
export class CancelProvisionalFundingSourceUseCase {
  private readonly log: Logger

  public constructor(
    private readonly fundingSourceService: FundingSourceService,
    private readonly userService: SudoUserService,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

  async execute(id: string): Promise<ProvisionalFundingSourceEntity> {
    this.log.debug(this.constructor.name, {
      id,
    })
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.fundingSourceService.cancelProvisionalFundingSource({
      id,
    })
  }
}
