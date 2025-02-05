/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DefaultLogger,
  InsufficientEntitlementsError,
} from '@sudoplatform/sudo-common'
import { SudoEntitlementsClient } from '@sudoplatform/sudo-entitlements'
import { SudoEntitlementsAdminClient } from '@sudoplatform/sudo-entitlements-admin'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { v4 } from 'uuid'
import waitForExpect from 'wait-for-expect'
import {
  BankAccountType,
  CompleteFundingSourceCompletionDataInput,
  CreditCardNetwork,
  FundingSourceCompletionDataInvalidError,
  FundingSourceNotSetupError,
  FundingSourceState,
  FundingSourceType,
  IdentityVerificationNotVerifiedError,
  ProvisionalFundingSourceNotFoundError,
  SudoVirtualCardsClient,
  isCheckoutBankAccountProvisionalFundingSourceProvisioningData,
  isStripeCardProvisionalFundingSourceProvisioningData,
} from '../../../src'
import { uuidV4Regex } from '../../utility/uuidV4Regex'
import {
  confirmStripeSetupIntent,
  createBankAccountFundingSource,
  getTestCard,
} from '../util/createFundingSource'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient CompleteFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let entitlementsAdminClient: SudoEntitlementsAdminClient
  let entitlementsClient: SudoEntitlementsClient
  let userClient: SudoUserClient
  let fundingSourceProviders: FundingSourceProviders
  let bankAccountFundingSourceExpendableEnabled: boolean
  let beforeAllComplete = false

  beforeAll(async () => {
    const result = await setupVirtualCardsClient({
      log,
      // Override default entitlement so we can control authorization
      entitlements: [
        {
          name: 'sudoplatform.virtual-cards.bankAccountFundingSourceExpendable',
          value: 0,
        },
      ],
    })
    instanceUnderTest = result.virtualCardsClient
    entitlementsAdminClient = result.entitlementsAdminClient
    entitlementsClient = result.entitlementsClient
    userClient = result.userClient
    fundingSourceProviders = result.fundingSourceProviders
    bankAccountFundingSourceExpendableEnabled =
      result.bankAccountFundingSourceExpendableEnabled

    beforeAllComplete = true
  })

  function expectSetupComplete() {
    expect({ beforeAllComplete }).toEqual({ beforeAllComplete: true })
  }

  const dummyCompletionDataForProvider: Record<
    string,
    CompleteFundingSourceCompletionDataInput
  > = {
    stripe: {
      provider: 'stripe',
      paymentMethod: 'dummyPaymentMethod',
    },
    checkoutBankAccount: {
      provider: 'checkout',
      type: FundingSourceType.BankAccount,
      accountId: 'dummyAccountId',
      institutionId: 'dummyInstitutionId',
      publicToken: 'dummyPublicToken',
      authorizationText: {
        language: 'en-US',
        content: 'authorization-text-content',
        contentType: 'authorization-text-content-type',
        hash: 'authorization-text-hash',
        hashAlgorithm: 'authorization-text-hash-algorithm',
      },
    },
  }

  describe('CompleteFundingSource', () => {
    waitForExpect.defaults.timeout = 7500
    waitForExpect.defaults.interval = 500

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

      let beforeEachComplete = false
      beforeEach(async () => {
        if (skip) return
        await unentitleBankAccountFundingSourceExpendable()
        await waitForExpect(async () => {
          const entitlements =
            await entitlementsClient.getEntitlementsConsumption()
          expect(
            entitlements?.consumption.find(
              (c) =>
                c.name ===
                  'sudoplatform.virtual-cards.bankAccountFundingSourceExpendable' &&
                c.available !== 0,
            ),
          ).toBeFalsy()
        })
        beforeEachComplete = true
      })

      afterEach(() => {
        beforeEachComplete = false
      })

      function expectSetupComplete() {
        expect({ beforeAllComplete, beforeEachComplete }).toEqual({
          beforeAllComplete: true,
          beforeEachComplete: true,
        })
      }

      async function entitleBankAccountFundingSourceExpendable(
        n = 1,
      ): Promise<void> {
        if (bankAccountFundingSourceExpendableEnabled) {
          const userName = await userClient.getUserName()
          if (userName === undefined) {
            fail('userName unexpectedly falsy')
          }
          await entitlementsAdminClient.applyExpendableEntitlementsToUser(
            userName,
            [
              {
                name: 'sudoplatform.virtual-cards.bankAccountFundingSourceExpendable',
                value: n,
              },
            ],
            v4(),
          )
        }
      }

      async function unentitleBankAccountFundingSourceExpendable(): Promise<void> {
        if (bankAccountFundingSourceExpendableEnabled) {
          const userName = await userClient.getUserName()
          if (userName === undefined) {
            fail('userName unexpectedly falsy')
          }
          const entitlements =
            await entitlementsAdminClient.getEntitlementsForUser(userName)
          const available =
            entitlements?.consumption.find(
              (e) =>
                e.name ===
                'sudoplatform.virtual-cards.bankAccountFundingSourceExpendable',
            )?.available ?? 0

          if (available > 0) {
            await entitlementsAdminClient.applyExpendableEntitlementsToUser(
              userName,
              [
                {
                  name: 'sudoplatform.virtual-cards.bankAccountFundingSourceExpendable',
                  value: -available,
                },
              ],
              v4(),
            )
          }
        }
      }

      it('returns ProvisionalFundingSourceNotFoundError if invalid id', async () => {
        if (skip) return

        expectSetupComplete()

        await instanceUnderTest.createKeysIfAbsent()

        await expect(
          instanceUnderTest.completeFundingSource({
            id: v4(),
            completionData:
              dummyCompletionDataForProvider['checkoutBankAccount'],
          }),
        ).rejects.toThrow(ProvisionalFundingSourceNotFoundError)
      })

      it('returns IdentityVerificationNotVerifiedError for user that does not match identity verification', async () => {
        if (skip) return

        expectSetupComplete()

        await entitleBankAccountFundingSourceExpendable()
        await instanceUnderTest.createKeysIfAbsent()

        await expect(
          createBankAccountFundingSource(instanceUnderTest, {
            username: 'custom_identity_mismatch',
            supportedProviders: ['checkout'],
          }),
        ).rejects.toThrow(IdentityVerificationNotVerifiedError)
      })

      it('returns fully provisioned bank account funding source', async () => {
        if (skip) return

        expectSetupComplete()

        await entitleBankAccountFundingSourceExpendable()
        await instanceUnderTest.createKeysIfAbsent()

        const result = await createBankAccountFundingSource(instanceUnderTest, {
          username: 'custom_checking_500',
          supportedProviders: ['checkout'],
        })
        expect(result).toMatchObject({
          version: 1,
          currency: 'USD',
          last4: expect.stringMatching(/\d{4}/),
          state: FundingSourceState.Active,
          type: FundingSourceType.BankAccount,
          bankAccountType: BankAccountType.Checking,
          institutionName: 'First Platypus Bank',
          unfundedAmount: undefined,
        })
      })

      it.each`
        name               | accountId      | institutionId      | publicToken
        ${'accountId'}     | ${''}          | ${'institutionId'} | ${'publicToken'}
        ${'institutionId'} | ${'accountId'} | ${''}              | ${'publicToken'}
        ${'publicToken'}   | ${'accountId'} | ${'institutionId'} | ${''}
      `(
        'returns FundingSourceCompletionDataInvalidError if empty $name in completionData',
        async ({ accountId, institutionId, publicToken }) => {
          if (skip) return

          await instanceUnderTest.createKeysIfAbsent()

          const provisionalFundingSource =
            await instanceUnderTest.setupFundingSource({
              currency: 'USD',
              type: FundingSourceType.BankAccount,
              supportedProviders: ['checkout'],
              applicationName: 'system-test-app',
            })

          const provisioningData = provisionalFundingSource.provisioningData
          if (
            !isCheckoutBankAccountProvisionalFundingSourceProvisioningData(
              provisioningData,
            )
          ) {
            throw new Error('Unexpected provisioning data type')
          }
          expect(
            provisioningData.authorizationText.length,
          ).toBeGreaterThanOrEqual(1)

          const checkoutBankAccountCompletionData: CompleteFundingSourceCompletionDataInput =
            {
              provider: 'checkout',
              type: FundingSourceType.BankAccount,
              accountId,
              institutionId,
              publicToken,
              authorizationText: provisioningData.authorizationText[0],
            }

          await expect(
            instanceUnderTest.completeFundingSource({
              id: provisionalFundingSource.id,
              completionData: checkoutBankAccountCompletionData,
            }),
          ).rejects.toThrow(FundingSourceCompletionDataInvalidError)
        },
      )

      describe('for expendable entitlement enabled', () => {
        beforeAll(() => {
          if (!skip && !bankAccountFundingSourceExpendableEnabled) {
            console.warn(
              `Bank account funding source expendable entitlement not enabled. Skipping tests.`,
            )
            skip = true
          }
        })

        it('should throw InsufficientEntitlementsException on complete if not entitled', async () => {
          if (skip) return

          expectSetupComplete()

          await instanceUnderTest.createKeysIfAbsent()

          await expect(
            createBankAccountFundingSource(instanceUnderTest, {
              username: 'custom_checking_500',
              supportedProviders: ['checkout'],
            }),
          ).rejects.toThrow(new InsufficientEntitlementsError())
        })
      })
    })

    describe.each`
      provider    | providerEnabled
      ${'stripe'} | ${'stripeCardEnabled'}
    `(
      'for card provider $provider',
      ({
        provider,
        providerEnabled,
      }: {
        provider: keyof FundingSourceProviders['apis']
        providerEnabled: keyof Omit<FundingSourceProviders, 'apis'>
      }) => {
        let skip = false
        beforeAll(() => {
          // Since we determine availability of provider
          // asynchronously we can't use that knowledge
          // to control the set of providers we iterate
          // over so we have to use a flag
          if (!fundingSourceProviders[providerEnabled]) {
            console.warn(
              `Card provider ${provider} not enabled. Skipping tests.`,
            )
            skip = true
          }
        })

        it('returns ProvisionalFundingSourceNotFoundError if invalid id', async () => {
          if (skip) return

          expectSetupComplete()

          await expect(
            instanceUnderTest.completeFundingSource({
              id: v4(),
              completionData: dummyCompletionDataForProvider[provider],
            }),
          ).rejects.toThrow(ProvisionalFundingSourceNotFoundError)
        })

        it('returns FundingSourceCompletionDataInvalidError if invalid completionData', async () => {
          if (skip) return

          expectSetupComplete()

          const provisionalCard = await instanceUnderTest.setupFundingSource({
            currency: 'USD',
            type: FundingSourceType.CreditCard,
            supportedProviders: [provider],
            applicationName: 'system-test-app',
          })

          const card = getTestCard(provider)
          if (
            fundingSourceProviders.apis.stripe &&
            isStripeCardProvisionalFundingSourceProvisioningData(
              provisionalCard.provisioningData,
            )
          ) {
            const stripe = fundingSourceProviders.apis.stripe
            const setupIntent = await confirmStripeSetupIntent(
              stripe,
              card,
              provisionalCard.provisioningData,
            )
            if (!setupIntent.payment_method) {
              throw 'Failed to get payment_method from setup intent'
            }
          } else {
            fail(
              'No API defined for provider or provisioning data does not match known provider',
            )
          }

          await expect(
            instanceUnderTest.completeFundingSource({
              id: provisionalCard.id,
              completionData: dummyCompletionDataForProvider[provider],
            }),
          ).rejects.toThrow(FundingSourceCompletionDataInvalidError)
        })

        it('returns successfully when correct setup data used', async () => {
          if (skip) return

          expectSetupComplete()

          const provisionalCard = await instanceUnderTest.setupFundingSource({
            currency: 'USD',
            type: FundingSourceType.CreditCard,
            supportedProviders: [provider],
            applicationName: 'system-test-app',
          })

          const card = getTestCard(provider)
          let completionData: CompleteFundingSourceCompletionDataInput
          if (
            isStripeCardProvisionalFundingSourceProvisioningData(
              provisionalCard.provisioningData,
            )
          ) {
            const stripe = fundingSourceProviders.apis.stripe
            const setupIntent = await confirmStripeSetupIntent(
              stripe,
              card,
              provisionalCard.provisioningData,
            )
            if (typeof setupIntent.payment_method !== 'string') {
              throw 'Failed to get payment_method from setup intent'
            }
            completionData = {
              provider: 'stripe',
              type: FundingSourceType.CreditCard,
              paymentMethod: setupIntent.payment_method,
            }
          } else {
            fail('unrecognized provisioning data')
          }

          await expect(
            instanceUnderTest.completeFundingSource({
              id: provisionalCard.id,
              completionData,
            }),
          ).resolves.toMatchObject({
            currency: 'USD',
            id: expect.stringMatching(uuidV4Regex('vc-fnd')),
            owner: await userClient.getSubject(),
            version: 1,
            last4: card.last4,
            network: CreditCardNetwork.Visa,
            state: FundingSourceState.Active,
          })
        })
      },
    )

    // Stripe specific tests
    describe('for provider stripe:card', () => {
      let skip = false
      beforeAll(() => {
        // Since we determine availability of provider
        // asynchronously we can't use that knowledge
        // to control the set of providers we iterate
        // over so we have to use a flag
        if (!fundingSourceProviders.apis.stripe) {
          console.warn(`No API available for provider stripe. Skipping tests.`)
          skip = true
        }
      })

      it('returns FundingSourceNotSetupError if setup intent not confirmed', async () => {
        if (skip) return

        expectSetupComplete()

        const provisionalCard = await instanceUnderTest.setupFundingSource({
          currency: 'USD',
          type: FundingSourceType.CreditCard,
          supportedProviders: ['stripe'],
          applicationName: 'system-test-app',
        })

        await expect(
          instanceUnderTest.completeFundingSource({
            id: provisionalCard.id,
            completionData: dummyCompletionDataForProvider.stripe,
          }),
        ).rejects.toThrow(FundingSourceNotSetupError)
      })
    })
  })
})
