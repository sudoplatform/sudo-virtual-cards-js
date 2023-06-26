/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { FundingSourceSupportInfo } from '../../../../public/typings/config'
import { CurrencyAmountEntity } from '../transaction/transactionEntity'

export interface CurrencyVelocityEntity {
  currency: string
  velocity: string[]
}

export interface VirtualCardsConfigEntity {
  maxFundingSourceVelocity: string[]
  maxFundingSourceFailureVelocity: string[]
  maxCardCreationVelocity: string[]
  maxTransactionVelocity: CurrencyVelocityEntity[]
  maxTransactionAmount: CurrencyAmountEntity[]
  virtualCardCurrencies: string[]
  fundingSourceSupportInfo: FundingSourceSupportInfo[]
  bankAccountFundingSourceExpendableEnabled: boolean
}
