/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Amount with related currency code.
 */

export interface CurrencyAmount {
  /**
   * ISO-3 Currency Code.
   */
  currency: string
  /**
   * Amount of currency.
   */
  amount: number
}
