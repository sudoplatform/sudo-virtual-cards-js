/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as t from 'io-ts'

/* eslint-disable tree-shaking/no-side-effects-in-initialization */
export const FundingSourceTypeCodec = t.keyof({
  CREDIT_CARD: null,
  BANK_ACCOUNT: null,
})
/* eslint-enable tree-shaking/no-side-effects-in-initialization */
