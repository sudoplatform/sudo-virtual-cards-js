import { ProvisionalFundingSourceEntityTransformer } from '../../../../../../src/private/data/fundingSource/transformer/provisionalFundingSourceEntityTransformer'
import { EntityDataFactory } from '../../../../data-factory/entity'
import { GraphQLDataFactory } from '../../../../data-factory/graphQl'

describe('ProvisionalFundingSourceEntityTransformer Test Suite', () => {
  describe('ProvisionalFundingSourceEntityTransformer', () => {
    it('successfully transforms graphQL to entity format', () => {
      expect(
        ProvisionalFundingSourceEntityTransformer.transformGraphQL(
          GraphQLDataFactory.provisionalFundingSource,
        ),
      ).toStrictEqual(EntityDataFactory.provisionalFundingSource)
    })
  })
})
