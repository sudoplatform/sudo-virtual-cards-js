/*
 * Copyright © 2024 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { NotSignedInError } from '@sudoplatform/sudo-common'
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
import { CancelProvisionalFundingSourceUseCase } from '../../../../../../src/private/domain/use-cases/fundingSource/cancelProvisionalFundingSourceUseCase'

describe('CancelProvisionalFundingSourceUseCase Test Suite', () => {
  const mockFundingSourceService = mock<FundingSourceService>()
  const mockUserService = mock<SudoUserService>()

  let instanceUnderTest: CancelProvisionalFundingSourceUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    reset(mockUserService)
    instanceUnderTest = new CancelProvisionalFundingSourceUseCase(
      instance(mockFundingSourceService),
      instance(mockUserService),
    )
    when(mockUserService.isSignedIn()).thenResolve(true)
  })

  describe('execute', () => {
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(instanceUnderTest.execute('')).rejects.toThrow(
        NotSignedInError,
      )
    })
    it('completes successfully with valid input', async () => {
      when(
        mockFundingSourceService.cancelProvisionalFundingSource(anything()),
      ).thenResolve(EntityDataFactory.provisionalFundingSource)
      const result = await instanceUnderTest.execute(
        EntityDataFactory.provisionalFundingSource.id,
      )
      expect(result).toStrictEqual(EntityDataFactory.provisionalFundingSource)
      const [inputArgs] = capture(
        mockFundingSourceService.cancelProvisionalFundingSource,
      ).first()
      expect(inputArgs).toStrictEqual<typeof inputArgs>({
        id: EntityDataFactory.provisionalFundingSource.id,
      })
      verify(
        mockFundingSourceService.cancelProvisionalFundingSource(anything()),
      ).once()
    })
  })
})
