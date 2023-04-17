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
import { AuthorizationText } from '../../../../public'
import { BankAccountType } from '../../../../public/typings/bankAccountType'
import { CardType } from '../../../../public/typings/cardType'
import {
  CreditCardNetwork,
  FundingSourceState,
} from '../../../../public/typings/fundingSource'
import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'

interface RefreshFundingSourceUseCaseCheckoutBankAccountRefreshData {
  provider: 'checkout'
  type: FundingSourceType.BankAccount
  accountId?: string
  authorizationText?: AuthorizationText
  applicationName: string
}

type RefreshFundingSourceUseCaseRefreshData =
  RefreshFundingSourceUseCaseCheckoutBankAccountRefreshData

interface RefreshFundingSourceUseCaseInput {
  id: string
  refreshData: RefreshFundingSourceUseCaseRefreshData
  language?: string
}

interface BaseRefreshFundingSourceUseCaseOutput {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  state: FundingSourceState
  type: FundingSourceType
  currency: string
}

interface RefreshCreditCardFundingSourceUseCaseOutput
  extends BaseRefreshFundingSourceUseCaseOutput {
  type: FundingSourceType.CreditCard
  last4: string
  network: CreditCardNetwork
  cardType: CardType
}

interface RefreshBankAccountFundingSourceUseCaseOutput
  extends BaseRefreshFundingSourceUseCaseOutput {
  type: FundingSourceType.BankAccount
  bankAccountType: BankAccountType
  last4: string
  institutionName: string
  institutionLogo?: {
    type: string
    data: string
  }
}

export type RefreshFundingSourceUseCaseOutput =
  | RefreshCreditCardFundingSourceUseCaseOutput
  | RefreshBankAccountFundingSourceUseCaseOutput

export enum FundingSourceType {
  CreditCard = 'CREDIT_CARD',
  BankAccount = 'BANK_ACCOUNT',
}

export class RefreshFundingSourceUseCase {
  private readonly log: Logger

  public constructor(
    private readonly fundingSourceService: FundingSourceService,
    private readonly userService: SudoUserService,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

  async execute(
    input: RefreshFundingSourceUseCaseInput,
  ): Promise<RefreshFundingSourceUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }

    return await this.fundingSourceService.refreshFundingSource(input)
  }
}
