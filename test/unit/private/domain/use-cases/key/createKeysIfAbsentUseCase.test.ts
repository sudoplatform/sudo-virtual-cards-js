/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { NotSignedInError } from '@sudoplatform/sudo-common'
import { instance, mock, reset, verify, when } from 'ts-mockito'
import { CreateKeyIfAbsentResult } from '../../../../../../src'
import { KeyService } from '../../../../../../src/private/domain/entities/key/keyService'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { CreateKeysIfAbsentUseCase } from '../../../../../../src/private/domain/use-cases/key/createKeysIfAbsent'

describe('CreateKeysIfAbsentUseCase tests', () => {
  const mockSudoUserService = mock<SudoUserService>()
  const mockKeyService = mock<KeyService>()

  let instanceUnderTest: CreateKeysIfAbsentUseCase

  const symmetricKeyExistsResult: CreateKeyIfAbsentResult = {
    created: false,
    keyId: 'existing-symmetric-key',
  }
  const keyPairExistsResult: CreateKeyIfAbsentResult = {
    created: false,
    keyId: 'existing-key-pair',
  }

  beforeEach(() => {
    reset(mockSudoUserService)

    instanceUnderTest = new CreateKeysIfAbsentUseCase(
      instance(mockSudoUserService),
      instance(mockKeyService),
    )

    when(mockSudoUserService.isSignedIn()).thenResolve(true)
    when(mockKeyService.createSymmetricKeyIfAbsent()).thenResolve(
      symmetricKeyExistsResult,
    )
    when(mockKeyService.createAndRegisterKeyPairIfAbsent()).thenResolve(
      keyPairExistsResult,
    )
  })

  describe('execute', () => {
    it('should throw not signed in error if not signed in', async () => {
      when(mockSudoUserService.isSignedIn()).thenResolve(false)
      await expect(instanceUnderTest.execute()).rejects.toEqual(
        new NotSignedInError(),
      )

      verify(mockSudoUserService.isSignedIn()).once()
      verify(mockKeyService.createAndRegisterKeyPairIfAbsent()).never()
      verify(mockKeyService.createSymmetricKeyIfAbsent()).never()
    })

    it('should propagate request to key service for both symmetric key and key pair', async () => {
      await expect(instanceUnderTest.execute()).resolves.toEqual({
        symmetricKey: symmetricKeyExistsResult,
        keyPair: keyPairExistsResult,
      })
      verify(mockSudoUserService.isSignedIn()).once()
      verify(mockKeyService.createAndRegisterKeyPairIfAbsent()).once()
      verify(mockKeyService.createSymmetricKeyIfAbsent()).once()
    })
  })
})
