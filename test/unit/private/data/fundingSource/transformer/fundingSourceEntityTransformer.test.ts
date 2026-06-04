/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CardType as CardTypeGraphQL } from '../../../../../../src/gen/graphqlTypes'
import {
  CardTypeTransformer,
  FundingSourceEntityTransformer,
} from '../../../../../../src/private/data/fundingSource/transformer/fundingSourceEntityTransformer'
import { CardType } from '../../../../../../src/public/typings/cardType'
import { EntityDataFactory } from '../../../../data-factory/entity'
import { GraphQLDataFactory } from '../../../../data-factory/graphQl'

describe('FundingSourceEntityTransformer Test Suite', () => {
  describe('FundingSourceEntityTransformer', () => {
    it('successfully transforms credit card graphql to entity format', () => {
      expect(
        FundingSourceEntityTransformer.transformGraphQL(
          GraphQLDataFactory.creditCardfundingSource,
        ),
      ).toStrictEqual(EntityDataFactory.creditCardFundingSource)
    })
  })

  describe('CardTypeTransformer', () => {
    it.each`
      graphql                    | entity
      ${CardTypeGraphQL.Credit}  | ${CardType.Credit}
      ${CardTypeGraphQL.Debit}   | ${CardType.Debit}
      ${CardTypeGraphQL.Prepaid} | ${CardType.Prepaid}
      ${CardTypeGraphQL.Other}   | ${CardType.Other}
    `(
      'successfully transforms graphql card type $graphql to entity card type $entity',
      ({ graphql, entity }) => {
        expect(CardTypeTransformer.transformGraphQL(graphql)).toEqual(entity)
      },
    )
  })
})
