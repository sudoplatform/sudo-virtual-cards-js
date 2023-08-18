/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { FundingSourceSupportInfo } from '../../../../public/typings/virtualCardsConfig'
import { FundingSourceClientConfigurationEntity } from '../fundingSource/fundingSourceEntity'
import { CurrencyAmountEntity } from '../transaction/transactionEntity'

export interface CurrencyVelocityEntity {
  currency: string
  velocity: string[]
}

export interface ClientApplicationConfigurationEntity {
  data: string
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
  fundingSourceClientConfiguration?: FundingSourceClientConfigurationEntity
  clientApplicationConfiguration?: ClientApplicationConfigurationEntity
}
