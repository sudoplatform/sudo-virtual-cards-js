/*
 * Copyright © 2024 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CachePolicy, NotSignedInError } from '@sudoplatform/sudo-common'
import {
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito'
import { FundingSourceService } from '../../../../../../src/private/domain/entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { EntityDataFactory } from '../../../../data-factory/entity'
import { ListProvisionalFundingSourcesUseCase } from '../../../../../../src/private/domain/use-cases/fundingSource/listProvisionalFundingSourcesUseCase'

describe('ListProvisionalFundingSourcesUseCase Test Suite', () => {
  const mockFundingSourceService = mock<FundingSourceService>()
  const mockUserService = mock<SudoUserService>()

  let instanceUnderTest: ListProvisionalFundingSourcesUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    reset(mockUserService)
    instanceUnderTest = new ListProvisionalFundingSourcesUseCase(
      instance(mockFundingSourceService),
      instance(mockUserService),
    )
    when(mockUserService.isSignedIn()).thenResolve(true)
  })

  describe('execute', () => {
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(
        instanceUnderTest.execute({
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).rejects.toThrow(NotSignedInError)
    })
    it('completes successfully', async () => {
      when(
        mockFundingSourceService.listProvisionalFundingSources(anything()),
      ).thenResolve({
        provisionalFundingSources: [EntityDataFactory.provisionalFundingSource],
      })
      const result = await instanceUnderTest.execute({
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(
        mockFundingSourceService.listProvisionalFundingSources(anything()),
      ).once()
      const [inputArgs] = capture(
        mockFundingSourceService.listProvisionalFundingSources,
      ).first()
      expect(inputArgs).toStrictEqual<typeof inputArgs>({
        filterInput: undefined,
        cachePolicy: CachePolicy.CacheOnly,
        limit: undefined,
        nextToken: undefined,
      })
      expect(result).toStrictEqual({
        provisionalFundingSources: [EntityDataFactory.provisionalFundingSource],
      })
    })

    it('completes successfully with empty result items', async () => {
      when(
        mockFundingSourceService.listProvisionalFundingSources(anything()),
      ).thenResolve({
        provisionalFundingSources: [],
      })
      const result = await instanceUnderTest.execute({
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(
        mockFundingSourceService.listProvisionalFundingSources(anything()),
      ).once()
      const [inputArgs] = capture(
        mockFundingSourceService.listProvisionalFundingSources,
      ).first()
      expect(inputArgs).toStrictEqual<typeof inputArgs>({
        filterInput: undefined,
        cachePolicy: CachePolicy.CacheOnly,
        limit: undefined,
        nextToken: undefined,
      })
      expect(result).toStrictEqual({
        provisionalFundingSources: [],
      })
    })
  })
})
