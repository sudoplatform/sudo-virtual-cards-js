import { VirtualCardEntityTransformer } from '../../../../../../src/private/data/virtualCard/transformer/virtualCardEntityTransformer'
import { EntityDataFactory } from '../../../../data-factory/entity'
import { ServiceDataFactory } from '../../../../data-factory/service'

describe('VirtualCardEntityTransformer Test Suite', () => {
  describe('VirtualCardEntityTransformer', () => {
    it('successfully transforms graphql to entity format', () => {
      expect(
        VirtualCardEntityTransformer.transform(
          ServiceDataFactory.virtualCardUnsealed,
        ),
      ).toStrictEqual(EntityDataFactory.virtualCard)
    })
  })
})
