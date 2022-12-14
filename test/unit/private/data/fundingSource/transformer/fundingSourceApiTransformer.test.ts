import { FundingSourceAPITransformer } from '../../../../../../src/private/data/fundingSource/transformer/fundingSourceApiTransformer'
import { ApiDataFactory } from '../../../../data-factory/api'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('FundingSourceApiTransformer Test Suite', () => {
  describe('FundingSourceApiTransformer', () => {
    it('successfully transforms entity to api format', () => {
      expect(
        FundingSourceAPITransformer.transformEntity(
          EntityDataFactory.defaultFundingSource,
        ),
      ).toStrictEqual(ApiDataFactory.defaultFundingSource)
    })
  })
})
