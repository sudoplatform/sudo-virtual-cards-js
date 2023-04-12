/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger, Logger } from '@sudoplatform/sudo-common'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'

interface UnsubscribeFromFundingSourceChangesUseCaseInput {
  id: string
}

/**
 * Application business logic for unsubscribing from change notifications for funding sources
 */
export class UnsubscribeFromFundingSourceChangesUseCase {
  private readonly log: Logger

  public constructor(
    private readonly fundingSourceService: FundingSourceService,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

  execute(input: UnsubscribeFromFundingSourceChangesUseCaseInput): void {
    this.log.debug(this.constructor.name, {
      input,
    })
    this.fundingSourceService.unsubscribeFromFundingSourceChanges(input)
  }
}
