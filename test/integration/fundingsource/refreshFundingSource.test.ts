/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger } from '@sudoplatform/sudo-common'
import { v4 } from 'uuid'
import {
  FundingSourceNotFoundError,
  FundingSourceType,
  RefreshFundingSourceRefreshDataInput,
  SudoVirtualCardsClient,
} from '../../../src'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient RefreshFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let fundingSourceProviders: FundingSourceProviders

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    fundingSourceProviders = result.fundingSourceProviders
  })

  const dummyStartRefreshDataForProvider: Record<
    string,
    RefreshFundingSourceRefreshDataInput
  > = {
    checkoutBankAccount: {
      provider: 'checkout',
      type: FundingSourceType.BankAccount,
      accountId: 'dummyAccountId',
      applicationName: 'system-test-app',
    },
  }

  const dummyCompleteRefreshDataForProvider: Record<
    string,
    RefreshFundingSourceRefreshDataInput
  > = {
    checkoutBankAccount: {
      provider: 'checkout',
      type: FundingSourceType.BankAccount,
      accountId: 'dummyAccountId',
      applicationName: 'system-test-app',
      authorizationText: {
        language: 'en-US',
        content: 'authorization-text-content',
        contentType: 'authorization-text-content-type',
        hash: 'authorization-text-hash',
        hashAlgorithm: 'authorization-text-hash-algorithm',
      },
    },
  }

  describe('RefreshFundingSource', () => {
    describe('for checkout bank account provider', () => {
      let skip = false
      beforeAll(() => {
        // Since we determine availability of provider
        // asynchronously we can't use that knowledge
        // to control the set of providers we iterate
        // over so we have to use a flag
        if (!fundingSourceProviders.checkoutBankAccountEnabled) {
          console.warn(
            `Checkout bank account provider not enabled. Skipping tests.`,
          )
          skip = true
        }
      })

      it('returns FundingSourceNotFoundError if invalid id', async () => {
        if (skip) return

        await instanceUnderTest.createKeysIfAbsent()

        await expect(
          instanceUnderTest.refreshFundingSource({
            id: v4(),
            refreshData:
              dummyStartRefreshDataForProvider['checkoutBankAccount'],
            language: 'en-US',
          }),
        ).rejects.toThrow(FundingSourceNotFoundError)
      })

      // Without the ability to complete bank account funding source setup, we cannot refresh a bank account funding source.
    })
  })
})
