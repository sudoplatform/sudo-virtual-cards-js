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
  VirtualCardsConfig,
} from '../../../src'
import { uuidV4Regex } from '../../utility/uuidV4Regex'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient SetupFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let userClient: SudoUserClient
  let clientConfig: VirtualCardsConfig
  let defaultFsClientConfig: FundingSourceClientConfiguration

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    userClient = result.userClient
    clientConfig = await instanceUnderTest.getVirtualCardsConfig()
    defaultFsClientConfig = clientConfig.fundingSourceClientConfiguration[0]
  })

  describe('SetupFundingSource', () => {
    it('returns expected output', async () => {
      // Set up callback to track sign-in guard behavior
      let callbackExecuted = false
      instanceUnderTest.setSignInCallback({
        signIn: async () => {
          callbackExecuted = true
          await Promise.resolve()
        },
      })

      const result = await instanceUnderTest.setupFundingSource({
        currency: 'USD',
        type: FundingSourceType.CreditCard,
        applicationName: 'system-test-app',
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
      // Verify that ensureSignedIn was called (callback should not execute in normal flow)
      // Since user is already signed in during integration tests, callback should not be called
      expect(callbackExecuted).toBe(false)
    })

    it('throws an error', async () => {
      await expect(
        instanceUnderTest.setupFundingSource({
          currency: 'AAAAAAAAAA',
          type: FundingSourceType.CreditCard,
          applicationName: 'system-test-app',
        }),
      ).rejects.toThrow()
    })

    it('executes sign-in callback when ensureSignedIn is triggered', async () => {
      let callbackInvocations = 0
      let callbackError: Error | undefined
      const signInDelegate = async () => {
        // Re-sign in the user since we signed them out for this test
        try {
          callbackInvocations++
          await userClient.signInWithKey()
        } catch (error) {
          callbackError = error as Error
          throw error
        }
      }

      // Set up callback to track when it gets executed
      instanceUnderTest.setSignInCallback({
        signIn: signInDelegate,
      })

      // Sign out the user to trigger the callback
      await userClient.globalSignOut()

      try {
        // This should trigger the ensureSignedIn callback
        const result = await instanceUnderTest.setupFundingSource({
          currency: 'USD',
          type: FundingSourceType.CreditCard,
          applicationName: 'system-test-app',
        })

        // Verify the callback was executed and successful
        expect(callbackInvocations).toBe(1)
        expect(callbackError).toBeUndefined()
        expect(result.state).toBe(ProvisionalFundingSourceState.Provisioning)
      } catch (error) {
        // If test fails, make sure we're signed back in for cleanup
        if (!callbackInvocations) {
          await userClient.signInWithKey()
        }
        throw error
      }
    })

    describe('checkout specific tests', () => {
      it('should return a checkout bank account provisional funding source', async () => {
        const checkoutBankAccountFsConfig =
          clientConfig.fundingSourceClientConfiguration.find(
            (config) =>
              config.type === 'checkout' &&
              config.fundingSourceType === FundingSourceType.BankAccount,
          )
        if (
          !checkoutBankAccountFsConfig ||
          !clientConfig.bankAccountFundingSourceCreationEnabled
        ) {
          return
        }

        const result = await instanceUnderTest.setupFundingSource({
          currency: 'USD',
          type: FundingSourceType.BankAccount,
          supportedProviders: ['checkout'],
          applicationName: 'system-test-app',
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
