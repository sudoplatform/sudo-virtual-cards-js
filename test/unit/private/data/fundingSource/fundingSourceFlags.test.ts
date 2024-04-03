/*
 * Copyright © 2024 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { EntityDataFactory } from '../../../data-factory/entity'
import {
  FundingSourceFlags,
  isFundingSourceUnfunded,
  fundingSourceNeedsRefresh,
} from '../../../../../src'

describe('FundingSourceFlags Test Suite', () => {
  describe('isFundingSourceUnfunded, fundingSourceNeedsRefresh', () => {
    it.each`
      flagsValue                                                   | unfundedValue | refreshValue
      ${[]}                                                        | ${false}      | ${false}
      ${[FundingSourceFlags.Unfunded]}                             | ${true}       | ${false}
      ${[FundingSourceFlags.Refresh]}                              | ${false}      | ${true}
      ${[FundingSourceFlags.Unfunded, FundingSourceFlags.Refresh]} | ${true}       | ${true}
      ${[FundingSourceFlags.Refresh, FundingSourceFlags.Unfunded]} | ${true}       | ${true}
    `(
      'correctly identifies unfunded funding source',
      ({ flagsValue, unfundedValue, refreshValue }) => {
        const flaggedFs = {
          ...EntityDataFactory.bankAccountFundingSource,
          flags: flagsValue,
        }
        expect(isFundingSourceUnfunded(flaggedFs)).toEqual(unfundedValue)
        expect(fundingSourceNeedsRefresh(flaggedFs)).toEqual(refreshValue)
      },
    )
  })
})
