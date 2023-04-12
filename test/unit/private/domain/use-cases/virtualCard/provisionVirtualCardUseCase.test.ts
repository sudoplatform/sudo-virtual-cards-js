/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
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
import { v4 } from 'uuid'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { VirtualCardService } from '../../../../../../src/private/domain/entities/virtualCard/virtualCardService'
import { ProvisionVirtualCardUseCase } from '../../../../../../src/private/domain/use-cases/virtualCard/provisionVirtualCardUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('ProvisionVirtualCardUseCase', () => {
  let instanceUnderTest: ProvisionVirtualCardUseCase
  const mockVirtualCardService = mock<VirtualCardService>()
  const mockUserService = mock<SudoUserService>()

  beforeEach(() => {
    reset(mockVirtualCardService)
    instanceUnderTest = new ProvisionVirtualCardUseCase(
      instance(mockVirtualCardService),
      instance(mockUserService),
    )
    when(mockUserService.isSignedIn()).thenResolve(true)
    when(mockVirtualCardService.provisionVirtualCard(anything())).thenResolve(
      EntityDataFactory.provisionalVirtualCard,
    )
  })

  describe('execute', () => {
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(
        instanceUnderTest.execute({
          ownershipProofs: [],
          fundingSourceId: '',
          cardHolder: '',
          alias: '',
          currency: '',
        }),
      ).rejects.toThrow(NotSignedInError)
    })
    it('calls virtual cards service provision', async () => {
      const clientRefId = v4()
      const ownershipProofs = [v4()]
      const fundingSourceId = v4()
      const cardHolder = v4()
      const alias = v4()
      const currency = v4()
      await instanceUnderTest.execute({
        clientRefId,
        ownershipProofs,
        fundingSourceId,
        cardHolder,
        alias,
        currency,
      })
      verify(mockVirtualCardService.provisionVirtualCard(anything())).once()
      const [args] = capture(
        mockVirtualCardService.provisionVirtualCard,
      ).first()
      expect(args).toStrictEqual<typeof args>({
        clientRefId,
        ownershipProofs,
        fundingSourceId,
        cardHolder,
        alias,
        currency,
      })
    })
    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.execute({
          ownershipProofs: [],
          fundingSourceId: '',
          cardHolder: '',
          alias: '',
          currency: '',
        }),
      ).resolves.toStrictEqual(EntityDataFactory.provisionalVirtualCard)
    })
  })
})
