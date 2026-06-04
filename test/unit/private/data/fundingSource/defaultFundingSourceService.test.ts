/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Base64, CachePolicy, PublicKeyFormat } from '@sudoplatform/sudo-common'
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
  ConnectionState,
  FundingSource,
  FundingSourceChangeSubscriber,
  FundingSourceType,
} from '../../../../../src'
import { OnFundingSourceUpdateSubscription } from '../../../../../src/gen/graphqlTypes'
import { ApiClient } from '../../../../../src/private/data/common/apiClient'
import {
  DeviceKeyWorker,
  UnsealInput,
} from '../../../../../src/private/data/common/deviceKeyWorker'
import { SubscriptionManager } from '../../../../../src/private/data/common/subscriptionManager'
import { DefaultFundingSourceService } from '../../../../../src/private/data/fundingSource/defaultFundingSourceService'
import { FundingSourceServiceCompletionData } from '../../../../../src/private/domain/entities/fundingSource/fundingSourceService'
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

    it('calls appSync', async () => {
      await instanceUnderTest.setupFundingSource({
        currency: 'dummyCurrency',
        type: FundingSourceType.CreditCard,
        setupData: { applicationName: 'system-test-app' },
      })
      verify(mockAppSync.setupFundingSource(anything())).once()
      const [args] = capture(mockAppSync.setupFundingSource).first()

      expect(args).toEqual<typeof args>({
        currency: 'dummyCurrency',
        type: FundingSourceType.CreditCard,
        setupData: Base64.encodeString(
          JSON.stringify({ applicationName: 'system-test-app' }),
        ),
      })
    })

    it('returns appsync data', async () => {
      await expect(
        instanceUnderTest.setupFundingSource({
          currency: 'dummyCurrency',
          type: FundingSourceType.CreditCard,
          setupData: { applicationName: 'system-test-app' },
        }),
      ).resolves.toEqual(EntityDataFactory.provisionalFundingSource)
    })
  })

  describe('completeFundingSource', () => {
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

  describe('subscribeToFundingSourceChanges', () => {
    it('calls services correctly', async () => {
      when(mockSubscriptionManager.getWatcher()).thenReturn(undefined)
      await instanceUnderTest.subscribeToFundingSourceChanges({
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
    it('calls appsync correctly', async () => {
      when(mockAppSync.getFundingSource(anything())).thenResolve(
        GraphQLDataFactory.creditCardfundingSource,
      )
      const id = v4()
      const result = await instanceUnderTest.getFundingSource({
        id,
      })
      verify(mockAppSync.getFundingSource(anything())).once()
      const [idArg] = capture(mockAppSync.getFundingSource).first()
      expect(idArg).toEqual<typeof idArg>(id)
      expect(result).toEqual(EntityDataFactory.creditCardFundingSource)
    })

    it('calls appsync correctly with undefined result', async () => {
      when(mockAppSync.getFundingSource(anything())).thenResolve(undefined)
      const id = v4()
      const result = await instanceUnderTest.getFundingSource({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockAppSync.getFundingSource(anything())).once()
      const [idArg] = capture(mockAppSync.getFundingSource).first()
      expect(idArg).toEqual<typeof idArg>(id)
      expect(result).toEqual(undefined)
    })

    it.each`
      cachePolicy               | test
      ${CachePolicy.CacheOnly}  | ${'cache'}
      ${CachePolicy.RemoteOnly} | ${'remote'}
    `(
      'returns transformed result when calling $test',
      async ({ cachePolicy }) => {
        when(mockAppSync.getFundingSource(anything())).thenResolve(
          GraphQLDataFactory.defaultFundingSource,
        )
        const id = v4()
        await expect(
          instanceUnderTest.getFundingSource({
            id,
            cachePolicy,
          }),
        ).resolves.toEqual(EntityDataFactory.defaultFundingSource)
        verify(mockAppSync.getFundingSource(anything())).once()
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
        ),
      ).once()
      expect(result).toEqual({
        fundingSources: [EntityDataFactory.creditCardFundingSource],
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
          ),
        ).thenResolve(GraphQLDataFactory.fundingSourceConnection)
        await expect(
          instanceUnderTest.listFundingSources({
            cachePolicy,
          }),
        ).resolves.toEqual({
          fundingSources: [EntityDataFactory.creditCardFundingSource],
          nextToken: undefined,
        })
        verify(
          mockAppSync.listFundingSources(
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
    it('calls appsync correctly', async () => {
      when(mockAppSync.cancelFundingSource(anything())).thenResolve(
        GraphQLDataFactory.creditCardfundingSource,
      )
      const result = await instanceUnderTest.cancelFundingSource({
        id: EntityDataFactory.creditCardFundingSource.id,
      })
      expect(result).toEqual(EntityDataFactory.creditCardFundingSource)
      const [inputArgs] = capture(mockAppSync.cancelFundingSource).first()
      expect(inputArgs).toEqual<typeof inputArgs>({
        id: EntityDataFactory.creditCardFundingSource.id,
      })
      verify(mockAppSync.cancelFundingSource(anything())).once()
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
        ),
      ).once()

      expect(result).toEqual({
        provisionalFundingSources: [EntityDataFactory.provisionalFundingSource],
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
          ),
        ).thenResolve(GraphQLDataFactory.provisionalFundingSourceConnection)
        await expect(
          instanceUnderTest.listProvisionalFundingSources({
            cachePolicy,
          }),
        ).resolves.toEqual({
          provisionalFundingSources: [
            EntityDataFactory.provisionalFundingSource,
          ],
          nextToken: undefined,
        })
        verify(
          mockAppSync.listProvisionalFundingSources(
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).once()
      },
    )
  })
})
