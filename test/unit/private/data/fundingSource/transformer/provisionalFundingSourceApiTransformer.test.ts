/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProvisionalFundingSourceApiTransformer } from '../../../../../../src/private/data/fundingSource/transformer/provisionalFundingSourceApiTransformer'
import { ApiDataFactory } from '../../../../data-factory/api'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('ProvisionalFundingSourceApiTransformer Test Suite', () => {
  describe('ProvisionalFundingSourceApiTransformer', () => {
    it('successfully transforms provisional credit card funding source entity to api format', () => {
      expect(
        ProvisionalFundingSourceApiTransformer.transformEntity(
          EntityDataFactory.provisionalFundingSource,
        ),
      ).toStrictEqual(ApiDataFactory.provisionalFundingSource)
    })
  })
})
