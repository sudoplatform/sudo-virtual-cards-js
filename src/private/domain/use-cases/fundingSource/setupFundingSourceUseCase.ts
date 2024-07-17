/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { NotSignedInError } from '@sudoplatform/sudo-common'
import { ProvisionalFundingSourceState } from '../../../../public/typings/fundingSource'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'

export enum FundingSourceType {
  CreditCard = 'CREDIT_CARD',
  BankAccount = 'BANK_ACCOUNT',
}

interface SetupFundingSourceUseCaseInput {
  type: FundingSourceType
  currency: string
  supportedProviders?: string[]
  applicationName: string
}

interface SetupFundingSourceUseCaseOutput {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  type: FundingSourceType
  state: ProvisionalFundingSourceState
  last4: string
  provisioningData: string
}

export class SetupFundingSourceUseCase {
  constructor(
    private readonly fundingSourceService: FundingSourceService,
    private readonly userService: SudoUserService,
  ) {}

  async execute({
    type,
    currency,
    supportedProviders,
    applicationName,
  }: SetupFundingSourceUseCaseInput): Promise<SetupFundingSourceUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.fundingSourceService.setupFundingSource({
      type,
      currency,
      supportedProviders,
      setupData: { applicationName },
    })
  }
}
