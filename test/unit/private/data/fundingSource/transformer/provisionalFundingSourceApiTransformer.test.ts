import { ProvisionalFundingSourceApiTransformer } from '../../../../../../src/private/data/fundingSource/transformer/provisionalFundingSourceApiTransformer'
import { ApiDataFactory } from '../../../../data-factory/api'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('ProvisionalFundingSourceApiTransformer Test Suite', () => {
  describe('ProvisionalFundingSourceApiTransformer', () => {
    it('successfully transforms entity to api format', () => {
      expect(
        ProvisionalFundingSourceApiTransformer.transformEntity(
          EntityDataFactory.provisionalFundingSource,
        ),
      ).toStrictEqual(ApiDataFactory.provisionalFundingSource)
    })
  })
})
