/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { instance, mock, reset, verify, when } from 'ts-mockito'
import { v4 } from 'uuid'
import { FundingSourceService } from '../../../../../../src/private/domain/entities/fundingSource/fundingSourceService'
import { GetFundingSourceClientConfigurationUseCase } from '../../../../../../src/private/domain/use-cases/fundingSource/getFundingSourceClientConfigurationUseCase'

describe('GetFundingSourceClientConfigurationUseCase', () => {
  const mockFundingSourceService = mock<FundingSourceService>()

  let instanceUnderTest: GetFundingSourceClientConfigurationUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    instanceUnderTest = new GetFundingSourceClientConfigurationUseCase(
      instance(mockFundingSourceService),
    )
  })

  describe('execute', () => {
    it('calls FundingSourceService getFundingSourceClientConfiguration', async () => {
      await instanceUnderTest.execute()
      verify(
        mockFundingSourceService.getFundingSourceClientConfiguration(),
      ).once()
    })

    it('returns FundingSourceService result', async () => {
      const result = v4()
      when(
        mockFundingSourceService.getFundingSourceClientConfiguration(),
      ).thenResolve(result)
      await expect(instanceUnderTest.execute()).resolves.toStrictEqual(result)
    })
  })
})
