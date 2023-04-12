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
    it.each`
      graphql                                                | entity
      ${GraphQLDataFactory.creditCardfundingSource}          | ${EntityDataFactory.creditCardFundingSource}
      ${GraphQLDataFactory.bankAccountFundingSourceUnsealed} | ${EntityDataFactory.bankAccountFundingSource}
    `(
      'successfully transforms graphql to entity format: $entity.type',
      ({ graphql, entity }) => {
        expect(
          FundingSourceEntityTransformer.transformGraphQL(graphql),
        ).toStrictEqual(entity)
      },
    )
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
