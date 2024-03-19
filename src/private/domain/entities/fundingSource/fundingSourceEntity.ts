/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { BankAccountType } from '../../../../public/typings/bankAccountType'
import { CardType } from '../../../../public/typings/cardType'
import {
  CreditCardNetwork,
  FundingSourceState,
  FundingSourceType,
  FundingSourceFlags,
} from '../../../../public/typings/fundingSource'
import { CurrencyAmount } from '../../../../public/typings/currencyAmount'

export interface FundingSourceClientConfigurationEntity {
  data: string
}

export interface BaseFundingSourceEntity {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  state: FundingSourceState
  flags: FundingSourceFlags[]
  type: FundingSourceType
  currency: string
  transactionVelocity?: {
    maximum?: number
    velocity?: string[]
  }
}
export interface CreditCardFundingSourceEntity extends BaseFundingSourceEntity {
  type: FundingSourceType.CreditCard
  last4: string
  network: CreditCardNetwork
  cardType: CardType
}
export interface BankAccountFundingSourceEntity
  extends BaseFundingSourceEntity {
  type: FundingSourceType.BankAccount
  bankAccountType: BankAccountType
  last4: string
  institutionName: string
  institutionLogo?: {
    type: string
    data: string
  }
  unfundedAmount?: CurrencyAmount
}

export type FundingSourceEntity =
  | CreditCardFundingSourceEntity
  | BankAccountFundingSourceEntity

export function isCreditCardFundingSourceEntity(
  e: FundingSourceEntity,
): e is CreditCardFundingSourceEntity {
  return e.type === FundingSourceType.CreditCard
}

export function isBankAccountFundingSourceEntity(
  e: FundingSourceEntity,
): e is BankAccountFundingSourceEntity {
  return e.type === FundingSourceType.BankAccount
}
