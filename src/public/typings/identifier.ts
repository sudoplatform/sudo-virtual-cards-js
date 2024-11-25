/*
 * Copyright © 2024 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Sudo Platform SDK representation of a filter used to filter entities based on their id field.
 *
 * @property {string} beginsWith The id field must begin with this string.
 * @property {string[]} between The id field falls alphabetically between the strings in the given array.
 * @property {string} contains The id field must contain this string.
 * @property {string} eq The id field must equal this string.
 * @property {string} ge The id field is alphabetically equal to or greater than this string.
 * @property {string} gt The id field is alphabetically greater than this string.
 * @property {string} le The id field is alphabetically equal to or less than this string.
 * @property {string} ne The id field must not be equal to this string.
 * @property {string} notContains The id field must not contain this string.
 */
export type IDFilterInput = {
  beginsWith?: string
  between?: string[]
  contains?: string
  eq?: string
  ge?: string
  gt?: string
  le?: string
  ne?: string
  notContains?: string
}
