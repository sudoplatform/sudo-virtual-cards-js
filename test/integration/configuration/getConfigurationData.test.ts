/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger } from '@sudoplatform/sudo-common'
import { Duration } from 'luxon'
import { SudoVirtualCardsClient } from '../../../src'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient GetConfigurationData Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

  let instanceUnderTest: SudoVirtualCardsClient

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
  })

  describe('GetConfigurationData', () => {
    function verifyVelocity(s: string): void {
      const elements = s.split('/')
      expect(elements).toHaveLength(2)

      const amount = Number(elements[0])
      expect(amount).not.toEqual(Number.NaN)
      expect(amount).toBeGreaterThanOrEqual(0)

      const period = Duration.fromISO(elements[1])
      expect(period.isValid).toEqual(true)
    }

    it('returns expected result', async () => {
      const config = await instanceUnderTest.getVirtualCardsConfig()

      config.maxCardCreationVelocity.forEach(verifyVelocity)
      config.maxFundingSourceFailureVelocity.forEach(verifyVelocity)
      config.maxFundingSourceVelocity.forEach(verifyVelocity)
      expect(config.maxTransactionAmount.length).toBeGreaterThanOrEqual(1)
      expect(config.maxTransactionVelocity.length).toBeGreaterThanOrEqual(1)
      expect(config.virtualCardCurrencies.length).toBeGreaterThanOrEqual(1)
      expect(config.fundingSourceSupportInfo.length).toBeGreaterThanOrEqual(1)
    })
  })
})
