import { ProvisionalFundingSourceApiTransformer } from '../../../../../../src/private/data/fundingSource/transformer/provisionalFundingSourceApiTransformer'
import { ApiDataFactory } from '../../../../data-factory/api'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('ProvisionalFundingSourceApiTransformer Test Suite', () => {
  describe('ProvisionalFundingSourceApiTransformer', () => {
    it.each`
      type              | entityType                                               | apiType
      ${'credit card'}  | ${EntityDataFactory.provisionalFundingSource}            | ${ApiDataFactory.provisionalFundingSource}
      ${'bank account'} | ${EntityDataFactory.provisionalBankAccountFundingSource} | ${ApiDataFactory.provisionalBankAccountFundingSource}
    `(
      'successfully transforms provisional $type funding source entity to api format',
      ({ entityType, apiType }) => {
        expect(
          ProvisionalFundingSourceApiTransformer.transformEntity(entityType),
        ).toStrictEqual(apiType)
      },
    )
  })
})
