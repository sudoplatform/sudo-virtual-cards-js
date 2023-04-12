/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger } from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import {
  FundingSourceClientConfiguration,
  FundingSourceType,
  ProvisionalFundingSourceState,
  SudoVirtualCardsClient,
} from '../../../src'
import { uuidV4Regex } from '../../utility/uuidV4Regex'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient SetupFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let userClient: SudoUserClient
  let fsClientConfig: FundingSourceClientConfiguration[]
  let defaultFsClientConfig: FundingSourceClientConfiguration

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    userClient = result.userClient
    fsClientConfig =
      await instanceUnderTest.getFundingSourceClientConfiguration()
    defaultFsClientConfig = fsClientConfig[0]
  })

  describe('SetupFundingSource', () => {
    it('returns expected output', async () => {
      const result = await instanceUnderTest.setupFundingSource({
        currency: 'USD',
        type: FundingSourceType.CreditCard,
      })
      expect(result).toMatchObject({
        id: expect.stringMatching(uuidV4Regex('vc-fnd')),
        owner: await userClient.getSubject(),
        version: 1,
        state: ProvisionalFundingSourceState.Provisioning,
      })
      expect(result.provisioningData).toMatchObject({
        version: 1,
        provider: defaultFsClientConfig.type,
      })
    })

    it('throws an error', async () => {
      await expect(
        instanceUnderTest.setupFundingSource({
          currency: 'AAAAAAAAAA',
          type: FundingSourceType.CreditCard,
        }),
      ).rejects.toThrow()
    })

    describe('checkout specific tests', () => {
      it('should return a checkout card provisional funding source', async () => {
        const checkoutCardFsConfig = fsClientConfig.find(
          (config) =>
            config.type === 'checkout' &&
            config.fundingSourceType === FundingSourceType.CreditCard,
        )
        if (!checkoutCardFsConfig) {
          return
        }

        const result = await instanceUnderTest.setupFundingSource({
          currency: 'USD',
          type: FundingSourceType.CreditCard,
          supportedProviders: ['checkout'],
        })

        expect(result.provisioningData).toMatchObject({
          version: 1,
          provider: checkoutCardFsConfig.type,
          type: FundingSourceType.CreditCard,
        })
      })

      it('should return a checkout bank account provisional funding source', async () => {
        const checkoutBankAccountFsConfig = fsClientConfig.find(
          (config) =>
            config.type === 'checkout' &&
            config.fundingSourceType === FundingSourceType.BankAccount,
        )
        if (!checkoutBankAccountFsConfig) {
          return
        }

        const result = await instanceUnderTest.setupFundingSource({
          currency: 'USD',
          type: FundingSourceType.BankAccount,
          supportedProviders: ['checkout'],
        })

        expect(result.provisioningData).toMatchObject({
          version: 1,
          provider: checkoutBankAccountFsConfig.type,
          type: FundingSourceType.BankAccount,
        })
      })
    })
  })
})
