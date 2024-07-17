/*
 * Copyright © 2024 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProvisionalFundingSourceFilterTransformer } from '../../../../../../src/private/data/fundingSource/transformer/provisionalFundingSourceFilterTransformer'
import { EntityDataFactory } from '../../../../data-factory/entity'
import { GraphQLDataFactory } from '../../../../data-factory/graphQl'

describe('ProvisionalFundingSourceEntityTransformer Test Suite', () => {
  describe('ProvisionalFundingSourceEntityTransformer', () => {
    it.each`
      type        | graphQlType                                             | entityType
      ${'simple'} | ${GraphQLDataFactory.provisionalFundingSourceFilter}    | ${EntityDataFactory.provisionalFundingSourceFilter}
      ${'and'}    | ${GraphQLDataFactory.provisionalFundingSourceFilterAnd} | ${EntityDataFactory.provisionalFundingSourceFilterAnd}
      ${'or'}     | ${GraphQLDataFactory.provisionalFundingSourceFilterOr}  | ${EntityDataFactory.provisionalFundingSourceFilterOr}
      ${'not'}    | ${GraphQLDataFactory.provisionalFundingSourceFilterNot} | ${EntityDataFactory.provisionalFundingSourceFilterNot}
    `(
      'successfully transforms provisional funding source $type filter input entity to graphQL format',
      ({ graphQlType, entityType }) => {
        expect(
          ProvisionalFundingSourceFilterTransformer.transformToGraphQL(
            entityType,
          ),
        ).toStrictEqual(graphQlType)
      },
    )
  })
})
