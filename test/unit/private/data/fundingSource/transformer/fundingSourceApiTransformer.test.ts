/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

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
