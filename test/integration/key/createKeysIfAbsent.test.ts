/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger } from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import waitForExpect from 'wait-for-expect'
import { SudoVirtualCardsClient } from '../../../src/public/sudoVirtualCardsClient'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('createKeysIfAbsent integration tests', () => {
  jest.setTimeout(240000)
  waitForExpect.defaults.interval = 250
  waitForExpect.defaults.timeout = 5000

  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let profilesClient: SudoProfilesClient
  let sudo: Sudo
  let fundingSourceProviders: FundingSourceProviders
  let beforeEachComplete = false

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    sudo = result.sudo
    fundingSourceProviders = result.fundingSourceProviders

    beforeEachComplete = true
  })

  function expectSetupComplete(): void {
    expect({ beforeEachComplete }).toEqual({ beforeEachComplete: true })
  }

  it('should create keys if no other operations have been performed', async () => {
    expectSetupComplete()

    await expect(instanceUnderTest.createKeysIfAbsent()).resolves.toEqual({
      symmetricKey: { created: true, keyId: expect.any(String) },
      keyPair: { created: true, keyId: expect.any(String) },
    })
  })

  it('should not create keys if they have been created due to virtual cards operation that needs them', async () => {
    expectSetupComplete()

    await provisionVirtualCard(
      instanceUnderTest,
      profilesClient,
      sudo,
      fundingSourceProviders,
    )

    await expect(instanceUnderTest.createKeysIfAbsent()).resolves.toEqual({
      symmetricKey: { created: false, keyId: expect.any(String) },
      keyPair: { created: false, keyId: expect.any(String) },
    })
  })

  it('should return existing key IDs and not create keys on a 2nd call', async () => {
    expectSetupComplete()

    const result = await instanceUnderTest.createKeysIfAbsent()

    await expect(instanceUnderTest.createKeysIfAbsent()).resolves.toEqual({
      symmetricKey: { created: false, keyId: result.symmetricKey.keyId },
      keyPair: { created: false, keyId: result.keyPair.keyId },
    })
  })
})
