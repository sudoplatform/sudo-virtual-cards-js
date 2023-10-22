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
import { SandboxGetPlaidDataInput, SandboxPlaidData } from '../../../../public'
import { FundingSourceSupportInfo } from '../../../../public/typings/virtualCardsConfig'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { CurrencyAmountEntity } from '../../entities/transaction/transactionEntity'

export interface CurrencyVelocityEntity {
  currency: string
  velocity: string[]
}

export interface VirtualCardsConfigUseCaseOutput {
  maxFundingSourceVelocity: string[]
  maxFundingSourceFailureVelocity: string[]
  maxFundingSourcePendingVelocity: string[]
  maxCardCreationVelocity: string[]
  maxTransactionVelocity: CurrencyVelocityEntity[]
  maxTransactionAmount: CurrencyAmountEntity[]
  virtualCardCurrencies: string[]
  fundingSourceSupportInfo: FundingSourceSupportInfo[]
  bankAccountFundingSourceExpendableEnabled: boolean
}

/**
 * Application business logic for retrieving configuration data.
 */
export class SandboxGetPlaidDataUseCase {
  private readonly log: Logger

  public constructor(
    private readonly fundingSourceService: FundingSourceService,
    private readonly userService: SudoUserService,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

  async execute(input: SandboxGetPlaidDataInput): Promise<SandboxPlaidData> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }

    this.log.info('Sandbox: Getting Plaid data', { input })

    return await this.fundingSourceService.sandboxGetPlaidData(input)
  }
}
