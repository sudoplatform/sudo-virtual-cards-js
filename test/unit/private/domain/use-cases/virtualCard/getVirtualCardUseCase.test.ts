/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
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
import { v4 } from 'uuid'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { VirtualCardService } from '../../../../../../src/private/domain/entities/virtualCard/virtualCardService'
import { GetVirtualCardUseCase } from '../../../../../../src/private/domain/use-cases/virtualCard/getVirtualCardUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('GetVirtualCardUseCase Test Suite', () => {
  let instanceUnderTest: GetVirtualCardUseCase
  const mockVirtualCardService = mock<VirtualCardService>()
  const mockUserService = mock<SudoUserService>()

  beforeEach(() => {
    reset(mockVirtualCardService)
    reset(mockUserService)
    instanceUnderTest = new GetVirtualCardUseCase(
      instance(mockVirtualCardService),
      instance(mockUserService),
    )
  })

  describe('execute', () => {
    beforeEach(() => {
      when(mockVirtualCardService.getVirtualCard(anything())).thenResolve(
        EntityDataFactory.virtualCard,
      )
      when(mockUserService.isSignedIn()).thenResolve(true)
    })
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(
        instanceUnderTest.execute({
          id: '',
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).rejects.toThrow(NotSignedInError)
    })
    it('completes successfully', async () => {
      const id = v4()
      const result = await instanceUnderTest.execute({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockVirtualCardService.getVirtualCard(anything())).once()
      const [args] = capture(mockVirtualCardService.getVirtualCard).first()
      expect(args).toStrictEqual<typeof args>({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(result).toStrictEqual(EntityDataFactory.virtualCard)
    })

    it('completes successfully with undefined result', async () => {
      when(mockVirtualCardService.getVirtualCard(anything())).thenResolve(
        undefined,
      )
      await expect(
        instanceUnderTest.execute({
          id: '',
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).resolves.toBeUndefined()
    })
  })
})
