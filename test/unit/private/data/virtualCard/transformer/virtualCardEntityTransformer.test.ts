/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { VirtualCardEntityTransformer } from '../../../../../../src/private/data/virtualCard/transformer/virtualCardEntityTransformer'
import { EntityDataFactory } from '../../../../data-factory/entity'
import { ServiceDataFactory } from '../../../../data-factory/service'

describe('VirtualCardEntityTransformer Test Suite', () => {
  describe('VirtualCardEntityTransformer', () => {
    it('successfully transforms graphql to entity format with no last transaction', () => {
      expect(
        VirtualCardEntityTransformer.transform(
          ServiceDataFactory.virtualCardUnsealed,
        ),
      ).toEqual(EntityDataFactory.virtualCard)
    })

    it('successfully transforms graphql to entity format with last transaction', () => {
      expect(
        VirtualCardEntityTransformer.transform({
          ...ServiceDataFactory.virtualCardUnsealed,
          lastTransaction: ServiceDataFactory.transactionUnsealed,
        }),
      ).toEqual({
        ...EntityDataFactory.virtualCard,
        lastTransaction: EntityDataFactory.transaction,
      })
    })
  })
})
