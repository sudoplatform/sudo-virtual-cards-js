/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger } from '@sudoplatform/sudo-common'
import { v4 } from 'uuid'
import {
  FundingSourceNotFoundError,
  FundingSourceState,
  FundingSourceStateError,
  FundingSourceType,
  RefreshFundingSourceInput,
  RefreshFundingSourceRefreshDataInput,
  SudoVirtualCardsClient,
} from '../../../src'
import { createBankAccountFundingSource } from '../util/createFundingSource'
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

      it('returns bank account funding source from refresh when refresh is not required', async () => {
        if (skip) return

        await instanceUnderTest.createKeysIfAbsent()

        const fundingSource = await createBankAccountFundingSource(
          instanceUnderTest,
          {
            username: 'custom_checking_500',
            supportedProviders: ['checkout'],
          },
        )
        expect(fundingSource).toBeDefined()

        const refreshData: RefreshFundingSourceRefreshDataInput = {
          provider: 'checkout',
          type: FundingSourceType.BankAccount,
          applicationName: 'webApplication',
        }
        const refreshInput: RefreshFundingSourceInput = {
          id: fundingSource.id,
          language: 'en-US',
          refreshData,
        }
        await expect(
          instanceUnderTest.refreshFundingSource(refreshInput),
        ).resolves.toMatchObject(fundingSource)
      })

      it('returns FundingSourceStateError from refresh if funding source is inactive', async () => {
        if (skip) return

        await instanceUnderTest.createKeysIfAbsent()

        const fundingSource = await createBankAccountFundingSource(
          instanceUnderTest,
          {
            username: 'custom_checking_500',
            supportedProviders: ['checkout'],
          },
        )
        expect(fundingSource.state).toEqual(FundingSourceState.Active)

        const cancelledFundingSource =
          await instanceUnderTest.cancelFundingSource(fundingSource.id)
        expect(cancelledFundingSource.state).toEqual(
          FundingSourceState.Inactive,
        )

        const refreshData: RefreshFundingSourceRefreshDataInput = {
          provider: 'checkout',
          type: FundingSourceType.BankAccount,
          applicationName: 'webApplication',
        }
        const refreshInput: RefreshFundingSourceInput = {
          id: fundingSource.id,
          language: 'en-US',
          refreshData,
        }
        await expect(
          instanceUnderTest.refreshFundingSource(refreshInput),
        ).rejects.toThrow(FundingSourceStateError)
      })
    })
  })
})
