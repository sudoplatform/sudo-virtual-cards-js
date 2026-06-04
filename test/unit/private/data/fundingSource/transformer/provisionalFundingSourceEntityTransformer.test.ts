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
    it('successfully transforms provisional credit card funding source graphQL to entity format', () => {
      expect(
        ProvisionalFundingSourceEntityTransformer.transformGraphQL(
          GraphQLDataFactory.provisionalFundingSource,
        ),
      ).toStrictEqual(EntityDataFactory.provisionalFundingSource)
    })
  })
})
