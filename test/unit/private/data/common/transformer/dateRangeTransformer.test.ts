/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DateRangeTransformer } from '../../../../../../src/private/data/common/transformer/dateRangeTransformer'

describe('DateRangeTransformer Test Suite', () => {
  describe('transformToGraphQLInput', () => {
    it('transforms as expected', () => {
      const startDate = new Date(100)
      const endDate = new Date(1000)
      expect(
        DateRangeTransformer.transformToGraphQLInput({
          startDate,
          endDate,
        }),
      ).toStrictEqual({
        startDateEpochMs: startDate.getTime(),
        endDateEpochMs: endDate.getTime(),
      })
    })
  })
})
