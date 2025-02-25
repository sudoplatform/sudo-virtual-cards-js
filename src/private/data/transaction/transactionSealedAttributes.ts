/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DeclineReason } from '../../../public/typings/transaction'
import {
  CurrencyAmountEntity,
  MarkupEntity,
} from '../../domain/entities/transaction/transactionEntity'

export interface TransactionSealedAttributes {
  billedAmount: CurrencyAmountEntity
  transactedAmount: CurrencyAmountEntity
  description: string
  transactedAtEpochMs: undefined
  transactedAt: Date
  settledAtEpochMs?: undefined
  settledAt: Date
  declineReason?: DeclineReason
  detail?: {
    virtualCardAmount: CurrencyAmountEntity
    markup: MarkupEntity
    markupAmount: CurrencyAmountEntity
    fundingSourceAmount: CurrencyAmountEntity
    transactedAtEpochMs?: undefined
    transactedAt?: Date
    settledAtEpochMs?: undefined
    settledAt?: Date
    fundingSourceId: string
    description: string
  }[]
}
