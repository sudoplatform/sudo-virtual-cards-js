/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Base64,
  CachePolicy,
  KeyNotFoundError,
  PublicKeyFormat,
} from '@sudoplatform/sudo-common'
import {
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito'
import { v4 } from 'uuid'
import {
  AuthorizationText,
  BankAccountType,
  ConnectionState,
  FundingSource,
  FundingSourceChangeSubscriber,
  FundingSourceType,
  SandboxGetPlaidDataInput,
} from '../../../../../src'
import {
  OnFundingSourceUpdateSubscription,
  SandboxGetPlaidDataResponse,
} from '../../../../../src/gen/graphqlTypes'
import { ApiClient } from '../../../../../src/private/data/common/apiClient'
import {
  DeviceKeyWorker,
  UnsealInput,
} from '../../../../../src/private/data/common/deviceKeyWorker'
import { SubscriptionManager } from '../../../../../src/private/data/common/subscriptionManager'
import { DefaultFundingSourceService } from '../../../../../src/private/data/fundingSource/defaultFundingSourceService'
import {
  FundingSourceServiceCompletionData,
  FundingSourceServiceRefreshData,
} from '../../../../../src/private/domain/entities/fundingSource/fundingSourceService'
import { SandboxPlaidDataEntity } from '../../../../../src/private/domain/entities/fundingSource/sandboxPlaidDataEntity'
import { EntityDataFactory } from '../../../data-factory/entity'
import { GraphQLDataFactory } from '../../../data-factory/graphQl'

// Constructor mocks
jest.mock('../../../../../src/private/data/common/subscriptionManager')
const JestMockSubscriptionManager = SubscriptionManager as jest.MockedClass<
  typeof SubscriptionManager
>
describe('DefaultFundingSourceService Test Suite', () => {
  const mockAppSync = mock<ApiClient>()
  const mockDeviceKeyWorker = mock<DeviceKeyWorker>()
  const mockSubscriptionManager =
    mock<
      SubscriptionManager<
        OnFundingSourceUpdateSubscription,
        FundingSourceChangeSubscriber
      >
    >()

  let instanceUnderTest: DefaultFundingSourceService

  beforeEach(() => {
    reset(mockAppSync)
    reset(mockDeviceKeyWorker)

    JestMockSubscriptionManager.mockImplementation(() =>
      instance(mockSubscriptionManager),
    )
    instanceUnderTest = new DefaultFundingSourceService(
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
  })

  describe('getFundingSourceClientConfiguration', () => {
    beforeEach(() => {
      when(mockAppSync.getFundingSourceClientConfiguration()).thenResolve({
        data: v4(),
      })
    })
    it('calls appSync', async () => {
      await instanceUnderTest.getFundingSourceClientConfiguration()
      verify(mockAppSync.getFundingSourceClientConfiguration()).once()
    })
    it('returns appsync data', async () => {
      const data = v4()
      when(mockAppSync.getFundingSourceClientConfiguration()).thenResolve({
        data,
      })
      await expect(
        instanceUnderTest.getFundingSourceClientConfiguration(),
      ).resolves.toEqual(data)
    })
  })

  describe('setupFundingSource', () => {
    beforeEach(() => {
      when(mockAppSync.setupFundingSource(anything())).thenResolve(
        GraphQLDataFactory.provisionalFundingSource,
      )
    })

    it.each`
      name              | type
      ${'credit card'}  | ${FundingSourceType.CreditCard}
      ${'bank account'} | ${FundingSourceType.BankAccount}
    `('calls appSync for $name', async ({ type }) => {
      await instanceUnderTest.setupFundingSource({
        currency: 'dummyCurrency',
        type,
        setupData: { applicationName: 'system-test-app' },
      })
      verify(mockAppSync.setupFundingSource(anything())).once()
      const [args] = capture(mockAppSync.setupFundingSource).first()

      expect(args).toEqual<typeof args>({
        currency: 'dummyCurrency',
        type,
        setupData: Base64.encodeString(
          JSON.stringify({ applicationName: 'system-test-app' }),
        ),
      })
    })

    it.each`
      name              | type
      ${'credit card'}  | ${FundingSourceType.CreditCard}
      ${'bank account'} | ${FundingSourceType.BankAccount}
    `('returns appsync data for $name', async ({ type }) => {
      await expect(
        instanceUnderTest.setupFundingSource({
          currency: 'dummyCurrency',
          type,
          setupData: { applicationName: 'system-test-app' },
        }),
      ).resolves.toEqual(EntityDataFactory.provisionalFundingSource)
    })
  })

  describe('completeFundingSource', () => {
    describe('for bank account', () => {
      const now = new Date()
      const signature = 'authorization-text-signature'
      beforeEach(() => {
        when(mockAppSync.completeFundingSource(anything())).thenResolve(
          GraphQLDataFactory.bankAccountfundingSource,
        )

        jest.useFakeTimers().setSystemTime(now)

        when(mockDeviceKeyWorker.signString(anything())).thenResolve(signature)
      })

      afterEach(() => {
        jest.useRealTimers()
      })

      it('calls appSync', async () => {
        const authorizationText: AuthorizationText = {
          content: 'authorizationText',
          contentType: 'authorizationTextContentType',
          language: 'authorizationTextLanguage',
          hash: 'authorizationTextHash',
          hashAlgorithm: 'authorizationTextHashAlgorithm',
        }

        const completionData: FundingSourceServiceCompletionData = {
          provider: 'checkout',
          type: FundingSourceType.BankAccount,
          publicToken: 'public-token',
          accountId: 'account-id',
          institutionId: 'institution-id',
          authorizationText,
        }
        await instanceUnderTest.completeFundingSource({
          id: 'dummyId',
          completionData,
        })
        verify(mockAppSync.completeFundingSource(anything())).once()
        const [args] = capture(mockAppSync.completeFundingSource).first()

        expect(args).toEqual<typeof args>({
          id: 'dummyId',
          completionData: expect.any(String),
          updateCardFundingSource: undefined,
        })

        const decodedActualCompletionData = JSON.parse(
          Base64.decodeString(args.completionData),
        )
        expect(decodedActualCompletionData).toEqual({
          provider: completionData.provider,
          type: FundingSourceType.BankAccount,
          version: 1,
          keyId: 'key-id',
          public_token: completionData.publicToken,
          account_id: completionData.accountId,
          institution_id: completionData.institutionId,
          authorizationTextSignature: {
            algorithm: 'RSASignatureSSAPKCS15SHA256',
            data: `{"hash":"${authorizationText.hash}","hashAlgorithm":"${
              authorizationText.hashAlgorithm
            }","signedAt":"${now.toISOString()}","account":"account-id"}`,
            keyId: 'key-id',
            signature,
          },
        })
      })

      it('returns appsync data', async () => {
        await expect(
          instanceUnderTest.completeFundingSource({
            id: 'dummyId',
            completionData: {
              provider: 'checkout',
              type: FundingSourceType.BankAccount,
              publicToken: 'public-token',
              accountId: 'account-id',
              institutionId: 'institution-id',
              authorizationText: {
                content: 'authorizationText',
                contentType: 'authorizationTextContentType',
                language: 'authorizationTextLanguage',
                hash: 'authorizationTextHash',
                hashAlgorithm: 'authorizationTextHashAlgorithm',
              },
            },
          }),
        ).resolves.toEqual(EntityDataFactory.bankAccountFundingSource)
      })

      it('throws KeyNotFoundError if no current registered public key', async () => {
        when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(undefined)

        const authorizationText: AuthorizationText = {
          content: 'authorizationText',
          contentType: 'authorizationTextContentType',
          language: 'authorizationTextLanguage',
          hash: 'authorizationTextHash',
          hashAlgorithm: 'authorizationTextHashAlgorithm',
        }

        const completionData: FundingSourceServiceCompletionData = {
          provider: 'checkout',
          type: FundingSourceType.BankAccount,
          publicToken: 'public-token',
          accountId: 'account-id',
          institutionId: 'institution-id',
          authorizationText,
        }
        await expect(
          instanceUnderTest.completeFundingSource({
            id: 'dummyId',
            completionData,
          }),
        ).rejects.toEqual(new KeyNotFoundError())

        verify(mockAppSync.completeFundingSource(anything())).never()
      })
    })

    describe('for credit card', () => {
      beforeEach(() => {
        when(mockAppSync.completeFundingSource(anything())).thenResolve(
          GraphQLDataFactory.defaultFundingSource,
        )
      })

      it('calls appSync', async () => {
        const completionData: FundingSourceServiceCompletionData = {
          provider: 'stripe',
          paymentMethod: v4(),
        }
        await instanceUnderTest.completeFundingSource({
          id: 'dummyId',
          completionData,
        })
        verify(mockAppSync.completeFundingSource(anything())).once()
        const [args] = capture(mockAppSync.completeFundingSource).first()

        expect(args).toEqual<typeof args>({
          id: 'dummyId',
          completionData: expect.any(String),
          updateCardFundingSource: undefined,
        })

        const decodedActualCompletionData = JSON.parse(
          Base64.decodeString(args.completionData),
        )
        expect(decodedActualCompletionData).toEqual({
          provider: completionData.provider,
          type: FundingSourceType.CreditCard,
          version: 1,
          payment_method: completionData.paymentMethod,
        })
      })

      it('returns appsync data', async () => {
        when(mockAppSync.completeFundingSource(anything())).thenResolve(
          GraphQLDataFactory.defaultFundingSource,
        )
        await expect(
          instanceUnderTest.completeFundingSource({
            id: 'dummyId',
            completionData: { provider: 'stripe', paymentMethod: '' },
          }),
        ).resolves.toEqual(EntityDataFactory.defaultFundingSource)
      })
    })
  })

  describe('refreshFundingSource', () => {
    describe('for bank account', () => {
      const now = new Date()
      const signature = 'authorization-text-signature'
      beforeEach(() => {
        when(mockAppSync.refreshFundingSource(anything())).thenResolve(
          GraphQLDataFactory.bankAccountfundingSource,
        )

        jest.useFakeTimers().setSystemTime(now)

        when(mockDeviceKeyWorker.signString(anything())).thenResolve(signature)
      })

      afterEach(() => {
        jest.useRealTimers()
      })

      it('calls appSync', async () => {
        const authorizationText: AuthorizationText = {
          content: 'authorizationText',
          contentType: 'authorizationTextContentType',
          language: 'authorizationTextLanguage',
          hash: 'authorizationTextHash',
          hashAlgorithm: 'authorizationTextHashAlgorithm',
        }

        const refreshData: FundingSourceServiceRefreshData = {
          provider: 'checkout',
          type: FundingSourceType.BankAccount,
          applicationName: 'system-test-app',
          accountId: 'account-id',
          authorizationText,
        }
        await instanceUnderTest.refreshFundingSource({
          id: 'dummyId',
          refreshData,
          language: 'en-us',
        })
        verify(mockAppSync.refreshFundingSource(anything())).once()
        const [args] = capture(mockAppSync.refreshFundingSource).first()

        expect(args).toEqual<typeof args>({
          id: 'dummyId',
          refreshData: expect.any(String),
          language: 'en-us',
        })

        const decodedActualRefreshData = JSON.parse(
          Base64.decodeString(args.refreshData),
        )
        expect(decodedActualRefreshData).toEqual({
          provider: refreshData.provider,
          type: FundingSourceType.BankAccount,
          applicationName: 'system-test-app',
          version: 1,
          keyId: 'key-id',
          authorizationTextSignature: {
            algorithm: 'RSASignatureSSAPKCS15SHA256',
            data: `{"hash":"${authorizationText.hash}","hashAlgorithm":"${
              authorizationText.hashAlgorithm
            }","signedAt":"${now.toISOString()}","account":"account-id"}`,
            keyId: 'key-id',
            signature,
          },
        })
      })

      it('returns appsync data', async () => {
        await expect(
          instanceUnderTest.refreshFundingSource({
            id: 'dummyId',
            refreshData: {
              provider: 'checkout',
              type: FundingSourceType.BankAccount,
              applicationName: 'system-test-app',
              accountId: 'account-id',
              authorizationText: {
                content: 'authorizationText',
                contentType: 'authorizationTextContentType',
                language: 'authorizationTextLanguage',
                hash: 'authorizationTextHash',
                hashAlgorithm: 'authorizationTextHashAlgorithm',
              },
            },
          }),
        ).resolves.toEqual(EntityDataFactory.bankAccountFundingSource)
      })

      it('throws KeyNotFoundError if no current registered public key', async () => {
        when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(undefined)

        const authorizationText: AuthorizationText = {
          content: 'authorizationText',
          contentType: 'authorizationTextContentType',
          language: 'authorizationTextLanguage',
          hash: 'authorizationTextHash',
          hashAlgorithm: 'authorizationTextHashAlgorithm',
        }

        const refreshData: FundingSourceServiceRefreshData = {
          provider: 'checkout',
          type: FundingSourceType.BankAccount,
          applicationName: 'system-test-app',
          accountId: 'account-id',
          authorizationText,
        }
        await expect(
          instanceUnderTest.refreshFundingSource({
            id: 'dummyId',
            refreshData,
          }),
        ).rejects.toEqual(new KeyNotFoundError())

        verify(mockAppSync.refreshFundingSource(anything())).never()
      })
    })
  })

  describe('subscribeToFundingSourceChanges', () => {
    it('calls services correctly', () => {
      when(mockSubscriptionManager.getWatcher()).thenReturn(undefined)
      instanceUnderTest.subscribeToFundingSourceChanges({
        owner: 'owner-id',
        id: 'subscribe-id',
        subscriber: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          fundingSourceChanged(_fundingSource: FundingSource): Promise<void> {
            return Promise.resolve()
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          connectionStatusChanged(_state: ConnectionState): void {
            return
          },
        },
      })
      verify(mockSubscriptionManager.subscribe(anything(), anything())).once()
      const [actualId] = capture(mockSubscriptionManager.subscribe).first()
      expect(actualId).toEqual<typeof actualId>('subscribe-id')

      verify(mockAppSync.onFundingSourceUpdate(anything())).once()
      const [ownerId] = capture(mockAppSync.onFundingSourceUpdate).first()
      expect(ownerId).toEqual<typeof ownerId>('owner-id')

      verify(mockSubscriptionManager.getWatcher()).twice()
      verify(mockSubscriptionManager.setWatcher(anything())).once()
      verify(mockSubscriptionManager.setSubscription(anything())).once()

      verify(
        mockSubscriptionManager.connectionStatusChanged(
          ConnectionState.Connected,
        ),
      ).once()
    })
  })

  describe('getFundingSource', () => {
    it.each`
      graphql                                        | entity
      ${GraphQLDataFactory.creditCardfundingSource}  | ${EntityDataFactory.creditCardFundingSource}
      ${GraphQLDataFactory.bankAccountfundingSource} | ${EntityDataFactory.bankAccountFundingSource}
    `('calls appsync correctly: $entity.type', async ({ graphql, entity }) => {
      when(mockAppSync.getFundingSource(anything(), anything())).thenResolve(
        graphql,
      )
      const id = v4()
      const result = await instanceUnderTest.getFundingSource({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockAppSync.getFundingSource(anything(), anything())).once()
      const [idArg, policyArg] = capture(mockAppSync.getFundingSource).first()
      expect(idArg).toEqual<typeof idArg>(id)
      expect(policyArg).toEqual<typeof policyArg>('cache-only')
      expect(result).toEqual(entity)
    })

    it('calls appsync correctly with undefined result', async () => {
      when(mockAppSync.getFundingSource(anything(), anything())).thenResolve(
        undefined,
      )
      const id = v4()
      const result = await instanceUnderTest.getFundingSource({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockAppSync.getFundingSource(anything(), anything())).once()
      const [idArg, policyArg] = capture(mockAppSync.getFundingSource).first()
      expect(idArg).toEqual<typeof idArg>(id)
      expect(policyArg).toEqual<typeof policyArg>('cache-only')
      expect(result).toEqual(undefined)
    })

    it.each`
      cachePolicy               | test
      ${CachePolicy.CacheOnly}  | ${'cache'}
      ${CachePolicy.RemoteOnly} | ${'remote'}
    `(
      'returns transformed result when calling $test',
      async ({ cachePolicy }) => {
        when(mockAppSync.getFundingSource(anything(), anything())).thenResolve(
          GraphQLDataFactory.defaultFundingSource,
        )
        const id = v4()
        await expect(
          instanceUnderTest.getFundingSource({
            id,
            cachePolicy,
          }),
        ).resolves.toEqual(EntityDataFactory.defaultFundingSource)
        verify(mockAppSync.getFundingSource(anything(), anything())).once()
      },
    )
  })

  describe('listFundingSources', () => {
    it('calls appsync correctly', async () => {
      when(
        mockAppSync.listFundingSources(
          anything(),
          anything(),
          anything(),
          anything(),
          anything(),
        ),
      ).thenResolve(GraphQLDataFactory.fundingSourceConnection)
      const result = await instanceUnderTest.listFundingSources({
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(
        mockAppSync.listFundingSources(
          anything(),
          anything(),
          anything(),
          anything(),
          anything(),
        ),
      ).once()
      const [policyArg] = capture(mockAppSync.listFundingSources).first()
      expect(policyArg).toEqual<typeof policyArg>('cache-only')
      expect(result).toEqual({
        fundingSources: [
          EntityDataFactory.creditCardFundingSource,
          EntityDataFactory.bankAccountFundingSource,
        ],
        nextToken: undefined,
      })
    })

    it.each`
      cachePolicy               | test
      ${CachePolicy.CacheOnly}  | ${'cache'}
      ${CachePolicy.RemoteOnly} | ${'remote'}
    `(
      'returns transformed result when calling $test',
      async ({ cachePolicy }) => {
        when(
          mockAppSync.listFundingSources(
            anything(),
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).thenResolve(GraphQLDataFactory.fundingSourceConnection)
        await expect(
          instanceUnderTest.listFundingSources({
            cachePolicy,
          }),
        ).resolves.toEqual({
          fundingSources: [
            EntityDataFactory.creditCardFundingSource,
            EntityDataFactory.bankAccountFundingSource,
          ],
          nextToken: undefined,
        })
        verify(
          mockAppSync.listFundingSources(
            anything(),
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).once()
      },
    )
  })

  describe('cancelFundingSource', () => {
    it.each`
      graphql                                        | entity
      ${GraphQLDataFactory.creditCardfundingSource}  | ${EntityDataFactory.creditCardFundingSource}
      ${GraphQLDataFactory.bankAccountfundingSource} | ${EntityDataFactory.bankAccountFundingSource}
    `('calls appsync correctly: $entity.type', async ({ graphql, entity }) => {
      when(mockAppSync.cancelFundingSource(anything())).thenResolve(graphql)
      const result = await instanceUnderTest.cancelFundingSource({
        id: entity.id,
      })
      expect(result).toEqual(entity)
      const [inputArgs] = capture(mockAppSync.cancelFundingSource).first()
      expect(inputArgs).toEqual<typeof inputArgs>({
        id: entity.id,
      })
      verify(mockAppSync.cancelFundingSource(anything())).once()
    })
  })

  describe('reviewUnfundedFundingSource', () => {
    it.each`
      graphql                                        | entity
      ${GraphQLDataFactory.creditCardfundingSource}  | ${EntityDataFactory.creditCardFundingSource}
      ${GraphQLDataFactory.bankAccountfundingSource} | ${EntityDataFactory.bankAccountFundingSource}
    `('calls appsync correctly: $entity.type', async ({ graphql, entity }) => {
      when(mockAppSync.reviewUnfundedFundingSource(anything())).thenResolve(
        graphql,
      )
      const result = await instanceUnderTest.reviewUnfundedFundingSource({
        id: entity.id,
      })
      expect(result).toEqual(entity)
      const [inputArgs] = capture(
        mockAppSync.reviewUnfundedFundingSource,
      ).first()
      expect(inputArgs).toEqual<typeof inputArgs>({
        id: entity.id,
      })
      verify(mockAppSync.reviewUnfundedFundingSource(anything())).once()
    })
  })

  describe('cancelProvisionalFundingSource', () => {
    it('calls appsync correctly', async () => {
      when(mockAppSync.cancelProvisionalFundingSource(anything())).thenResolve(
        GraphQLDataFactory.provisionalFundingSource,
      )
      const entity = EntityDataFactory.provisionalFundingSource
      const result = await instanceUnderTest.cancelProvisionalFundingSource({
        id: entity.id,
      })
      expect(result).toEqual(entity)
      const [inputArgs] = capture(
        mockAppSync.cancelProvisionalFundingSource,
      ).first()
      expect(inputArgs).toEqual<typeof inputArgs>({
        id: entity.id,
      })
      verify(mockAppSync.cancelProvisionalFundingSource(anything())).once()
    })
  })

  describe('listProvisionalFundingSources', () => {
    it('calls appsync correctly', async () => {
      when(
        mockAppSync.listProvisionalFundingSources(
          anything(),
          anything(),
          anything(),
          anything(),
          anything(),
        ),
      ).thenResolve(GraphQLDataFactory.provisionalFundingSourceConnection)
      const result = await instanceUnderTest.listProvisionalFundingSources({
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(
        mockAppSync.listProvisionalFundingSources(
          anything(),
          anything(),
          anything(),
          anything(),
          anything(),
        ),
      ).once()
      const [policyArg] = capture(
        mockAppSync.listProvisionalFundingSources,
      ).first()
      expect(policyArg).toEqual<typeof policyArg>('cache-only')
      expect(result).toEqual({
        provisionalFundingSources: [
          EntityDataFactory.provisionalFundingSource,
          EntityDataFactory.provisionalBankAccountFundingSource,
        ],
        nextToken: undefined,
      })
    })

    it.each`
      cachePolicy               | test
      ${CachePolicy.CacheOnly}  | ${'cache'}
      ${CachePolicy.RemoteOnly} | ${'remote'}
    `(
      'returns transformed result when calling $test',
      async ({ cachePolicy }) => {
        when(
          mockAppSync.listProvisionalFundingSources(
            anything(),
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).thenResolve(GraphQLDataFactory.provisionalFundingSourceConnection)
        await expect(
          instanceUnderTest.listProvisionalFundingSources({
            cachePolicy,
          }),
        ).resolves.toEqual({
          provisionalFundingSources: [
            EntityDataFactory.provisionalFundingSource,
            EntityDataFactory.provisionalBankAccountFundingSource,
          ],
          nextToken: undefined,
        })
        verify(
          mockAppSync.listProvisionalFundingSources(
            anything(),
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).once()
      },
    )
  })

  describe('sandboxGetPlaidData', () => {
    const input: SandboxGetPlaidDataInput = {
      institutionId: 'institution-id',
      plaidUsername: 'plaid-username',
    }

    const entity: SandboxPlaidDataEntity = {
      accountMetadata: [
        { accountId: 'account-id-1', subtype: BankAccountType.Checking },
        { accountId: 'account-id-2', subtype: BankAccountType.Savings },
        { accountId: 'account-id-3', subtype: BankAccountType.Other },
        { accountId: 'account-id-4', subtype: BankAccountType.Other },
      ],
      publicToken: 'public-token',
    }

    const graphql: SandboxGetPlaidDataResponse = {
      accountMetadata: [
        { accountId: 'account-id-1', subtype: 'checking' },
        { accountId: 'account-id-2', subtype: 'savings' },
        { accountId: 'account-id-3', subtype: 'something-else' },
        { accountId: 'account-id-4' },
      ],
      publicToken: 'public-token',
    }

    it('calls appsync correctly', async () => {
      when(mockAppSync.sandboxGetPlaidData(anything())).thenResolve(graphql)

      await expect(
        instanceUnderTest.sandboxGetPlaidData(input),
      ).resolves.toEqual(entity)

      verify(mockAppSync.sandboxGetPlaidData(anything())).once()
      const [inputArgs] = capture(mockAppSync.sandboxGetPlaidData).first()
      expect(inputArgs).toEqual<typeof inputArgs>({
        input: {
          institutionId: input.institutionId,
          username: input.plaidUsername,
        },
      })
    })
  })

  describe('sandboxSetFundingSourceToRequireRefresh', () => {
    const graphql = GraphQLDataFactory.bankAccountfundingSource
    const entity = EntityDataFactory.bankAccountFundingSource

    it('calls appsync correctly', async () => {
      when(
        mockAppSync.sandboxSetFundingSourceToRequireRefresh(anything()),
      ).thenResolve(graphql)

      await expect(
        instanceUnderTest.sandboxSetFundingSourceToRequireRefresh({
          fundingSourceId: entity.id,
        }),
      ).resolves.toEqual(entity)

      verify(
        mockAppSync.sandboxSetFundingSourceToRequireRefresh(anything()),
      ).once()
      const [inputArgs] = capture(
        mockAppSync.sandboxSetFundingSourceToRequireRefresh,
      ).first()
      expect(inputArgs).toEqual<typeof inputArgs>({
        input: {
          fundingSourceId: entity.id,
        },
      })
    })
  })
})
