/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger, PublicKeyFormat } from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { Observable } from 'apollo-client/util/Observable'
import { anything, instance, mock, when } from 'ts-mockito'
import { v4 } from 'uuid'
import waitForExpect from 'wait-for-expect'
import {
  CompleteFundingSourceCompletionDataInput,
  ConnectionState,
  CreditCardNetwork,
  FundingSource,
  FundingSourceState,
  FundingSourceType,
  ProvisionalFundingSource,
  SudoVirtualCardsClient,
  isCheckoutCardProvisionalFundingSourceProvisioningData,
  isStripeCardProvisionalFundingSourceProvisioningData,
} from '../../../src'
import { ApiClient } from '../../../src/private/data/common/apiClient'
import {
  DeviceKeyWorker,
  UnsealInput,
} from '../../../src/private/data/common/deviceKeyWorker'
import { DefaultFundingSourceService } from '../../../src/private/data/fundingSource/defaultFundingSourceService'
import { delay } from '../../utility/delay'
import { uuidV4Regex } from '../../utility/uuidV4Regex'
import {
  confirmStripeSetupIntent,
  generateCheckoutPaymentToken,
  getTestCard,
} from '../util/createFundingSource'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { IdentityAdminClient } from '../util/identityAdminClient'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient SubscribeToFundingSourceUpdates Test Suite', () => {
  jest.setTimeout(240000)
  waitForExpect.defaults.interval = 250
  waitForExpect.defaults.timeout = 15000

  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let fundingSourceProviders: FundingSourceProviders
  let userClient: SudoUserClient
  let identityAdminClient: IdentityAdminClient
  let username: string
  let connectionState: ConnectionState = ConnectionState.Disconnected

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    fundingSourceProviders = result.fundingSourceProviders
    userClient = result.userClient
    identityAdminClient = result.identityAdminClient
    username = (await userClient.getUserName()) ?? fail('username not defined')

    // Create a subscription simply to monitor connection state
    // and wait for initial connection to be set up.
    await instanceUnderTest.subscribeToFundingSourceChanges(
      'initial-subscription',
      {
        fundingSourceChanged: () => Promise.resolve(),
        connectionStatusChanged: (state) => (connectionState = state),
      },
    )
    await waitForExpect(() =>
      expect(connectionState).toEqual(ConnectionState.Connected),
    )
  })

  describe('SubscribeToFundingSourceUpdates', () => {
    // Note that this suite does not test for connection state change
    // notifications since the behaviour of that is presently global to the
    // client rather than individual subscriptions.
    describe.each`
      provider      | providerEnabled
      ${'stripe'}   | ${'stripeCardEnabled'}
      ${'checkout'} | ${'checkoutCardEnabled'}
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
        let subscriptionCalled = false
        let notifiedFundingSource: FundingSource | undefined = undefined
        let fundingSource: FundingSource | undefined
        const subscriptionIds: string[] = []

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

        beforeEach(async () => {
          if (skip) return
          subscriptionCalled = false
          notifiedFundingSource = undefined

          // Account may still appear eventual-inconsistently locked so wait for success
          let provisionalFundingSource: ProvisionalFundingSource | undefined
          await waitForExpect(async () => {
            provisionalFundingSource =
              await instanceUnderTest.setupFundingSource({
                currency: 'USD',
                type: FundingSourceType.CreditCard,
                supportedProviders: [provider],
                applicationName: 'system-test-app',
              })
          })
          if (!provisionalFundingSource) {
            fail('provisionalFundingSource unexpectedly falsy')
          }

          const card = getTestCard(provider)
          let completionData: CompleteFundingSourceCompletionDataInput
          if (
            isStripeCardProvisionalFundingSourceProvisioningData(
              provisionalFundingSource.provisioningData,
            )
          ) {
            const stripe = fundingSourceProviders.apis.stripe
            const setupIntent = await confirmStripeSetupIntent(
              stripe,
              card,
              provisionalFundingSource.provisioningData,
            )
            if (typeof setupIntent.payment_method !== 'string') {
              throw 'Failed to get payment_method from setup intent'
            }
            completionData = {
              provider: 'stripe',
              type: FundingSourceType.CreditCard,
              paymentMethod: setupIntent.payment_method,
            }
          } else if (
            fundingSourceProviders.apis.checkout &&
            isCheckoutCardProvisionalFundingSourceProvisioningData(
              provisionalFundingSource.provisioningData,
            )
          ) {
            const paymentToken = await generateCheckoutPaymentToken(
              fundingSourceProviders.apis.checkout,
              card,
              provisionalFundingSource.provisioningData,
            )
            completionData = {
              provider: 'checkout',
              type: FundingSourceType.CreditCard,
              paymentToken,
            }
          } else {
            fail('unrecognized provisioning data')
          }

          fundingSource = await instanceUnderTest.completeFundingSource({
            id: provisionalFundingSource.id,
            completionData,
          })
          expect(fundingSource).toMatchObject({
            currency: 'USD',
            id: expect.stringMatching(uuidV4Regex('vc-fnd')),
            owner: await userClient.getSubject(),
            version: 1,
            last4: card.last4,
            network: CreditCardNetwork.Visa,
            state: FundingSourceState.Active,
          })
        })

        afterEach(async () => {
          subscriptionIds.forEach((subscriptionId) =>
            instanceUnderTest.unsubscribeFromFundingSourceChanges(
              subscriptionId,
            ),
          )

          await identityAdminClient.enableUser({
            input: {
              username,
            },
          })
          if (
            fundingSource &&
            notifiedFundingSource?.state !== FundingSourceState.Inactive
          ) {
            await instanceUnderTest.cancelFundingSource(fundingSource.id)
          }
        })

        it('Successfully notifies of funding source update if subscribed', async () => {
          if (skip) return
          const subscriptionId = v4()
          subscriptionIds.push(subscriptionId)

          await instanceUnderTest.subscribeToFundingSourceChanges(
            subscriptionId,
            {
              fundingSourceChanged(
                fundingSource: FundingSource,
              ): Promise<void> {
                subscriptionCalled = true
                notifiedFundingSource = fundingSource
                return Promise.resolve()
              },
            },
          )
          expect(connectionState).toEqual(ConnectionState.Connected)

          if (!fundingSource) {
            fail('no funding source was set up')
          }
          const username = await userClient.getUserName()
          if (!username) {
            fail('User is not signed in')
          }
          await identityAdminClient.disableUser({
            input: {
              username,
            },
          })

          await waitForExpect(() => {
            expect(subscriptionCalled).toBeTruthy()
            expect(notifiedFundingSource?.id).toEqual(fundingSource?.id)
            expect(notifiedFundingSource?.state).toEqual(
              FundingSourceState.Inactive,
            )
          })
        })

        it('Does not notify of funding source update if not subscribed', async () => {
          if (skip) return
          const subscriptionId = v4()
          subscriptionIds.push(subscriptionId)

          await instanceUnderTest.subscribeToFundingSourceChanges(
            subscriptionId,
            {
              fundingSourceChanged(
                fundingSource: FundingSource,
              ): Promise<void> {
                subscriptionCalled = true
                notifiedFundingSource = fundingSource
                return Promise.resolve(undefined)
              },
            },
          )
          expect(connectionState).toEqual(ConnectionState.Connected)

          if (!fundingSource) {
            fail('no funding source was set up')
          }

          instanceUnderTest.unsubscribeFromFundingSourceChanges(subscriptionId)

          const username = await userClient.getUserName()
          if (!username) {
            fail('User is not signed in')
          }
          await identityAdminClient.disableUser({
            input: {
              username,
            },
          })

          // For negative test we wait for 5s and make sure subscription
          // wasn't invoked in that time frame
          await delay(5000)
          expect(subscriptionCalled).toBeFalsy()
          expect(notifiedFundingSource).toBeUndefined()
        })
      },
    )

    it('execution error invokes error handler and connection state change', async () => {
      const mockAppSync = mock<ApiClient>()
      const mockDeviceKeyWorker = mock<DeviceKeyWorker>()

      const fundingSourceService = new DefaultFundingSourceService(
        instance(mockAppSync),
        instance(mockDeviceKeyWorker),
      )

      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve({
        id: 'key-id',
        keyRingId: 'key-ring-id',
        algorithm: 'key-algorithm',
        data: 'key-data',
        format: PublicKeyFormat.SPKI,
      })

      when(mockDeviceKeyWorker.unsealString(anything())).thenCall(
        (input: UnsealInput) => {
          switch (input.encrypted) {
            case 'sealed-dummyInstitutionName':
              return 'dummyInstitutionName'
            case 'sealed-dummyInstitutionLogo':
              return JSON.stringify({
                type: 'image/png',
                data: 'dummyInstitutionLogo',
              })
            default:
              return `unknown sealed input: ${input.encrypted}`
          }
        },
      )
      const networkError = {
        name: 'name',
        message: 'message',
        statusCode: 401,
      }
      when(mockAppSync.onFundingSourceUpdate(anything())).thenReturn(
        new Observable((observer) => {
          observer.error(networkError)
        }),
      )
      let latestConnectionStatus: ConnectionState = ConnectionState.Disconnected
      let connectionStatusChangedCalled = false

      fundingSourceService.subscribeToFundingSourceChanges({
        owner: 'owner-id',
        id: 'subscribe-id',
        subscriber: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          fundingSourceChanged(_fundingSource: FundingSource): Promise<void> {
            return Promise.resolve()
          },
          connectionStatusChanged(state: ConnectionState): void {
            connectionStatusChangedCalled = true
            latestConnectionStatus = state
          },
        },
      })

      expect(connectionStatusChangedCalled).toBeTruthy()

      await waitForExpect(() =>
        expect(latestConnectionStatus).toBe(ConnectionState.Disconnected),
      )
    })
  })
})
