import { FundingSourceEntityTransformer } from '../../../../../../src/private/data/fundingSource/transformer/fundingSourceEntityTransformer'
import { EntityDataFactory } from '../../../../data-factory/entity'
import { GraphQLDataFactory } from '../../../../data-factory/graphQl'

describe('FundingSourceEntityTransformer Test Suite', () => {
  describe('FundingSourceEntityTransformer', () => {
    it('successfully transforms graphql to entity format', () => {
      expect(
        FundingSourceEntityTransformer.transformGraphQL(
          GraphQLDataFactory.fundingSource,
        ),
      ).toStrictEqual(EntityDataFactory.fundingSource)
    })
  })
})
