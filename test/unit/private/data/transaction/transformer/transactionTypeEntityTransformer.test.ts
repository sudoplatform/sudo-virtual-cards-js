/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransactionType as TransactionTypeEntity } from '../../../../../../src'
import { TransactionType } from '../../../../../../src/gen/graphqlTypes'
import { TransactionTypeEntityTransformer } from '../../../../../../src/private/data/transaction/transformer/transactionTypeEntityTransformer'

describe('TransactionTypeEntityTransformer Test Suite', () => {
  describe('transformToGraphQLInput', () => {
    it.each`
      input                             | expected
      ${TransactionTypeEntity.Pending}  | ${TransactionType.Pending}
      ${TransactionTypeEntity.Complete} | ${TransactionType.Complete}
      ${TransactionTypeEntity.Refund}   | ${TransactionType.Refund}
      ${TransactionTypeEntity.Decline}  | ${TransactionType.Decline}
    `(
      'converts transaction type entity ($input) to the graphQL input type',
      ({ input, expected }) => {
        expect(
          TransactionTypeEntityTransformer.transformToGraphQLInput(input),
        ).toStrictEqual(expected)
      },
    )
  })
})
