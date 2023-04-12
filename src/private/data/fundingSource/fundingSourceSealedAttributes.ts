/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BankAccountFundingSource,
  CreditCardFundingSource,
} from '../../../gen/graphqlTypes'

export interface BankAccountFundingSourceSealedAttributes {
  institutionName: string
  institutionLogo?: {
    type: string
    data: string
  }
}

export type BankAccountFundingSourceUnsealed = Omit<
  BankAccountFundingSource,
  keyof BankAccountFundingSourceSealedAttributes
> &
  BankAccountFundingSourceSealedAttributes

export type FundingSourceUnsealed =
  | CreditCardFundingSource
  | BankAccountFundingSourceUnsealed
