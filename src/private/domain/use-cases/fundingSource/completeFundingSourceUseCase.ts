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
import { CardType } from '../../../../public/typings/cardType'
import {
  CreditCardNetwork,
  FundingSourceState,
} from '../../../../public/typings/fundingSource'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'

interface CompleteFundingSourceUseCaseStripeCompletionData {
  provider: 'stripe'
  type?: FundingSourceType.CreditCard
  paymentMethod: string
}

type CompleteFundingSourceUseCaseCompletionData =
  CompleteFundingSourceUseCaseStripeCompletionData

interface CompleteFundingSourceUseCaseInput {
  id: string
  completionData: CompleteFundingSourceUseCaseCompletionData
  updateCardFundingSource?: boolean
}

interface BaseCompleteFundingSourceUseCaseOutput {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  state: FundingSourceState
  type: FundingSourceType
  currency: string
}

interface CompleteCreditCardFundingSourceUseCaseOutput extends BaseCompleteFundingSourceUseCaseOutput {
  type: FundingSourceType.CreditCard
  last4: string
  network: CreditCardNetwork
  cardType: CardType
}

export type CompleteFundingSourceUseCaseOutput =
  CompleteCreditCardFundingSourceUseCaseOutput

export enum FundingSourceType {
  CreditCard = 'CREDIT_CARD',
}

export class CompleteFundingSourceUseCase {
  private readonly log: Logger

  public constructor(
    private readonly fundingSourceService: FundingSourceService,
    private readonly userService: SudoUserService,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

  async execute(
    input: CompleteFundingSourceUseCaseInput,
  ): Promise<CompleteFundingSourceUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }

    return await this.fundingSourceService.completeFundingSource(input)
  }
}
