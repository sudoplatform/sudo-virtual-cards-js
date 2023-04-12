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
import { APIResultStatus } from '../../../../../../src'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { VirtualCardBillingAddressEntity } from '../../../../../../src/private/domain/entities/virtualCard/virtualCardEntity'
import { VirtualCardService } from '../../../../../../src/private/domain/entities/virtualCard/virtualCardService'
import { UpdateVirtualCardUseCase } from '../../../../../../src/private/domain/use-cases/virtualCard/updateVirtualCardUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('UpdateVirtualCardUseCase', () => {
  let instanceUnderTest: UpdateVirtualCardUseCase
  const mockVirtualCardService = mock<VirtualCardService>()
  const mockUserService = mock<SudoUserService>()

  beforeEach(() => {
    reset(mockVirtualCardService)
    instanceUnderTest = new UpdateVirtualCardUseCase(
      instance(mockVirtualCardService),
      instance(mockUserService),
    )
    when(mockUserService.isSignedIn()).thenResolve(true)
    when(mockVirtualCardService.updateVirtualCard(anything())).thenResolve({
      status: APIResultStatus.Success,
      result: EntityDataFactory.virtualCard,
    })
  })

  describe('execute', () => {
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(
        instanceUnderTest.execute({
          id: '',
          cardHolder: '',
          alias: '',
          billingAddress: undefined,
        }),
      ).rejects.toThrow(NotSignedInError)
    })
    it('calls virtual cards service provision', async () => {
      const id = v4()
      const expectedCardVersion = 10
      const cardHolder = v4()
      const alias = v4()
      const billingAddress = EntityDataFactory.virtualCard
        .billingAddress as VirtualCardBillingAddressEntity
      await instanceUnderTest.execute({
        id,
        expectedCardVersion,
        cardHolder,
        alias,
        billingAddress,
      })
      verify(mockVirtualCardService.updateVirtualCard(anything())).once()
      const [args] = capture(mockVirtualCardService.updateVirtualCard).first()
      expect(args).toStrictEqual<typeof args>({
        id,
        expectedCardVersion,
        cardHolder,
        alias,
        billingAddress,
      })
    })
    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.execute({
          id: '',
          cardHolder: '',
          alias: '',
          billingAddress: undefined,
        }),
      ).resolves.toStrictEqual({
        status: APIResultStatus.Success,
        result: EntityDataFactory.virtualCard,
      })
    })
  })
})
