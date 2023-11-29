/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CachePolicy,
  DefaultLogger,
  KeyNotFoundError,
} from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import waitForExpect from 'wait-for-expect'
import {
  GetVirtualCardInput,
  SudoVirtualCardsClient,
} from '../../../src/public/sudoVirtualCardsClient'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('import export keys integration tests', () => {
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

  it('export then import keys successfully', async () => {
    expectSetupComplete()

    const cardHolder = 'exportImportKeysCardHolder'
    const testCard = await provisionVirtualCard(
      instanceUnderTest,
      profilesClient,
      sudo,
      fundingSourceProviders,
      { cardHolder: cardHolder },
    )

    expect(testCard.cardHolder).toEqual(cardHolder)

    const exportedKeysVirtualCards = await instanceUnderTest.exportKeys()

    // remove all crypto keys from KeyManager
    await instanceUnderTest.reset()

    const getVirtualCardInput: GetVirtualCardInput = {
      id: testCard.id,
      cachePolicy: CachePolicy.RemoteOnly,
    }
    await expect(
      instanceUnderTest.getVirtualCard(getVirtualCardInput),
    ).rejects.toThrow(KeyNotFoundError)

    await instanceUnderTest.importKeys(exportedKeysVirtualCards)

    const restoredKeysCard =
      await instanceUnderTest.getVirtualCard(getVirtualCardInput)
    expect(restoredKeysCard?.cardHolder).toEqual(testCard.cardHolder)
    expect(restoredKeysCard?.pan).toEqual(testCard.pan)
    expect(restoredKeysCard?.csc).toEqual(testCard.csc)
  })
})
