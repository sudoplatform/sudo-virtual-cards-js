/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CachePolicy,
  DefaultLogger,
  Logger,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import { BankAccountType } from '../../../../public/typings/bankAccountType'
import { CardType } from '../../../../public/typings/cardType'
import {
  CreditCardNetwork,
  FundingSourceState,
  FundingSourceType,
  FundingSourceFlags,
} from '../../../../public/typings/fundingSource'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'

/**
 * Input for {@link GetFundingSourceUseCase}.
 *
 * @interface GetFundingSourceInput
 * @property {string} id The identifier of the funding source to attempt to retrieve.
 * @property {CachePolicy} cachePolicy Cache policy determines the strategy for accessing the funding source record.
 */
interface GetFundingSourceUseCaseInput {
  id: string
  cachePolicy?: CachePolicy
}

interface BaseGetFundingSourceUseCaseOutput {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  type: FundingSourceType
  state: FundingSourceState
  flags: FundingSourceFlags[]
  currency: string
}

export interface GetCreditCardFundingSourceUseCaseOutput
  extends BaseGetFundingSourceUseCaseOutput {
  type: FundingSourceType.CreditCard
  last4: string
  network: CreditCardNetwork
  cardType: CardType
}

export interface GetBankAccountFundingSourceUseCaseOutput
  extends BaseGetFundingSourceUseCaseOutput {
  type: FundingSourceType.BankAccount
  bankAccountType: BankAccountType
  last4: string
  institutionName: string
  institutionLogo?: {
    type: string
    data: string
  }
}

export type GetFundingSourceUseCaseOutput =
  | GetCreditCardFundingSourceUseCaseOutput
  | GetBankAccountFundingSourceUseCaseOutput

/**
 * Application business logic for retrieving a funding source.
 */
export class GetFundingSourceUseCase {
  private readonly log: Logger

  constructor(
    private readonly fundingSourceService: FundingSourceService,
    private readonly userService: SudoUserService,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

  async execute({
    id,
    cachePolicy,
  }: GetFundingSourceUseCaseInput): Promise<
    GetFundingSourceUseCaseOutput | undefined
  > {
    this.log.debug(this.constructor.name, {
      id,
      cachePolicy,
    })
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.fundingSourceService.getFundingSource({
      id,
      cachePolicy,
    })
  }
}
