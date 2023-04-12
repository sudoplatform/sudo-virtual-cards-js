/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Representation of virtual card transaction velocity
 * constraints.
 */
export interface TransactionVelocity {
  /**
   * Maximum value of any single virtual card transaction
   * in the minor currency unit of the funding source
   * funding the virtual card transaction.
   *
   * If undefined, then no maximum value constraint will be
   * applied.
   */
  maximum?: number

  /**
   * Array of velocity constraints applied to virtual card
   * transactions with amounts in the minor currency unit of the funding source
   * funding the virtual card transaction.
   *
   * The values are in the format: `<amount>/<period>`
   * where `<amount>` is a number in the minor currency unit
   * of the currency of the funding source and `<period>` is
   * an ISO8601 time period.
   *
   * If undefined, then no velocity constraints will
   * be applied.
   */
  velocity?: string[]
}
