/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DefaultLogger,
  Logger,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import { FundingSourceSupportInfo } from '../../../../public/typings/config'
import { VirtualCardsConfigService } from '../../entities/configuration/virtualCardsConfigService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { CurrencyAmountEntity } from '../../entities/transaction/transactionEntity'

export interface CurrencyVelocityEntity {
  currency: string
  velocity: string[]
}

export interface VirtualCardsConfigUseCaseOutput {
  maxFundingSourceVelocity: string[]
  maxFundingSourceFailureVelocity: string[]
  maxCardCreationVelocity: string[]
  maxTransactionVelocity: CurrencyVelocityEntity[]
  maxTransactionAmount: CurrencyAmountEntity[]
  virtualCardCurrencies: string[]
  fundingSourceSupportInfo: FundingSourceSupportInfo[]
}

/**
 * Application business logic for retrieving configuration data.
 */
export class GetVirtualCardsConfigUseCase {
  private readonly log: Logger

  public constructor(
    private readonly configurationDataService: VirtualCardsConfigService,
    private readonly userService: SudoUserService,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

  async execute(): Promise<VirtualCardsConfigUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }

    this.log.debug(this.constructor.name)
    return await this.configurationDataService.getVirtualCardsConfig()
  }
}
