/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { VirtualCardsConfigAPITransformer } from '../../../../../../src/private/data/configuration/transformer/virtualCardsConfigApiTransformer'
import { ApiDataFactory } from '../../../../data-factory/api'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('VirtualCardsConfigApiTransformer Test Suite', () => {
  describe('VirtualCardsConfigApiTransformer', () => {
    it('successfully transforms entity to api format', () => {
      expect(
        VirtualCardsConfigAPITransformer.transformEntity(
          EntityDataFactory.configurationData,
        ),
      ).toStrictEqual(ApiDataFactory.configurationData)
    })
  })
})
