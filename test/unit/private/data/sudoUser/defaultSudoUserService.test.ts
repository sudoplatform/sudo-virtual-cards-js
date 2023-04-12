/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { SudoUserClient } from '@sudoplatform/sudo-user'
import { instance, mock, reset, verify, when } from 'ts-mockito'
import { DefaultSudoUserService } from '../../../../../src/private/data/sudoUser/defaultSudoUserService'

describe('DefaultSudoUserService Test Suite', () => {
  const mockUserClient = mock<SudoUserClient>()

  let instanceUnderTest: DefaultSudoUserService
  beforeEach(() => {
    reset(mockUserClient)
    instanceUnderTest = new DefaultSudoUserService(instance(mockUserClient))
  })

  describe('isSignedIn', () => {
    it('calls userClient isSignedIn', async () => {
      await instanceUnderTest.isSignedIn()
      verify(mockUserClient.isSignedIn()).once()
    })

    it('returns value of userClient call', async () => {
      when(mockUserClient.isSignedIn()).thenResolve(true)
      await expect(instanceUnderTest.isSignedIn()).resolves.toBeTruthy()
    })
  })
})
