/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { VirtualCardsConfigEntityTransformer } from '../../../../../../src/private/data/configuration/transformer/virtualCardsConfigEntityTransformer'
import { EntityDataFactory } from '../../../../data-factory/entity'
import { GraphQLDataFactory } from '../../../../data-factory/graphQl'

describe('VirtualCardsConfigEntityTransformer Test Suite', () => {
  describe('VirtualCardsConfigEntityTransformer', () => {
    it('successfully transforms graphql to entity format', () => {
      expect(
        VirtualCardsConfigEntityTransformer.transformGraphQL(
          GraphQLDataFactory.configurationData,
        ),
      ).toEqual(EntityDataFactory.configurationData)
    })
  })
})
