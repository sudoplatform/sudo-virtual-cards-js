/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DeclineReason } from '../../../../public/typings/transaction'

export interface CurrencyAmountUseCaseOutput {
  currency: string
  amount: number
}

export interface TransactionDetailChargeUseCaseOutput {
  virtualCardAmount: CurrencyAmountUseCaseOutput
  markup: {
    percent: number
    flat: number
    minCharge?: number
  }
  markupAmount: CurrencyAmountUseCaseOutput
  fundingSourceAmount: CurrencyAmountUseCaseOutput
  transactedAt?: Date
  settledAt?: Date
  fundingSourceId: string
  description: string
}

export interface TransactionSealedAttributesUseCaseOutput {
  billedAmount: CurrencyAmountUseCaseOutput
  transactedAmount: CurrencyAmountUseCaseOutput
  description: string
  transactedAtEpochMs: undefined
  transactedAt: Date
  settledAt?: Date
  declineReason?: DeclineReason
  detail?: TransactionDetailChargeUseCaseOutput[]
}
