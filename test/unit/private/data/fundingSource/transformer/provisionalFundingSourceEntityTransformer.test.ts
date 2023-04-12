/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProvisionalFundingSourceEntityTransformer } from '../../../../../../src/private/data/fundingSource/transformer/provisionalFundingSourceEntityTransformer'
import { EntityDataFactory } from '../../../../data-factory/entity'
import { GraphQLDataFactory } from '../../../../data-factory/graphQl'

describe('ProvisionalFundingSourceEntityTransformer Test Suite', () => {
  describe('ProvisionalFundingSourceEntityTransformer', () => {
    it.each`
      type              | graphQlType                                               | entityType
      ${'credit card'}  | ${GraphQLDataFactory.provisionalFundingSource}            | ${EntityDataFactory.provisionalFundingSource}
      ${'bank account'} | ${GraphQLDataFactory.provisionalBankAccountFundingSource} | ${EntityDataFactory.provisionalBankAccountFundingSource}
    `(
      'successfully transforms provisional $type funding source graphQL to entity format',
      ({ graphQlType, entityType }) => {
        expect(
          ProvisionalFundingSourceEntityTransformer.transformGraphQL(
            graphQlType,
          ),
        ).toStrictEqual(entityType)
      },
    )
  })
})
