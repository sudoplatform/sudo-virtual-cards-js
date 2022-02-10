import {
  CachePolicy,
  KeyNotFoundError,
  ListOperationResultStatus,
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
import { APIResultStatus } from '../../../../../src'
import { KeyFormat } from '../../../../../src/gen/graphqlTypes'
import { ApiClient } from '../../../../../src/private/data/common/apiClient'
import { DeviceKeyWorker } from '../../../../../src/private/data/common/deviceKeyWorker'
import { TransactionWorker } from '../../../../../src/private/data/common/transactionWorker'
import {
  DefaultVirtualCardService,
  VirtualCardSealedAttributes,
} from '../../../../../src/private/data/virtualCard/defaultVirtualCardService'
import { ProvisionalVirtualCardEntity } from '../../../../../src/private/domain/entities/virtualCard/provisionalVirtualCardEntity'
import {
  VirtualCardBillingAddressEntity,
  VirtualCardEntity,
} from '../../../../../src/private/domain/entities/virtualCard/virtualCardEntity'
import { uuidV4Regex } from '../../../../utility/uuidV4Regex'
import { EntityDataFactory } from '../../../data-factory/entity'
import { GraphQLDataFactory } from '../../../data-factory/graphQl'
import { ServiceDataFactory } from '../../../data-factory/service'

describe('DefaultVirtualCardService Test Suite', () => {
  let instanceUnderTest: DefaultVirtualCardService
  const mockAppSync = mock<ApiClient>()
  const mockDeviceKeyWorker = mock<DeviceKeyWorker>()
  const mockTransactionWorker = mock<TransactionWorker>()

  beforeEach(() => {
    reset(mockAppSync)
    reset(mockDeviceKeyWorker)
    reset(mockTransactionWorker)

    instanceUnderTest = new DefaultVirtualCardService(
      instance(mockAppSync),
      instance(mockDeviceKeyWorker),
      instance(mockTransactionWorker),
    )

    when(mockTransactionWorker.unsealTransaction(anything())).thenResolve(
      ServiceDataFactory.transactionUnsealed,
    )
  })

  const generatePartialVirtualCard = (
    entity: VirtualCardEntity,
  ): Omit<VirtualCardEntity, keyof VirtualCardSealedAttributes> => {
    const _card = entity as any
    delete _card.alias
    delete _card.billingAddress
    delete _card.cardHolder
    delete _card.csc
    delete _card.expiry
    delete _card.pan
    delete _card.pan
    return _card as Omit<VirtualCardEntity, keyof VirtualCardSealedAttributes>
  }

  const generatePartialProvisionalCard = (
    entity: ProvisionalVirtualCardEntity,
  ): Omit<ProvisionalVirtualCardEntity, 'card'> => {
    const _provisional = entity as any
    delete _provisional.card
    return _provisional as Omit<ProvisionalVirtualCardEntity, 'card'>
  }

  describe('provisionVirtualCard', () => {
    beforeEach(() => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(
        ServiceDataFactory.deviceKey,
      )
      when(mockDeviceKeyWorker.generateKeyPair()).thenResolve(
        ServiceDataFactory.deviceKey,
      )
      when(mockAppSync.getKeyRing(anything())).thenResolve({
        items: [GraphQLDataFactory.publicKey],
      })
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED_STRING',
      )
      when(mockAppSync.provisionVirtualCard(anything())).thenResolve(
        GraphQLDataFactory.provisionalCard,
      )
      when(mockDeviceKeyWorker.keyExists(anything(), anything())).thenResolve(
        true,
      )
    })

    it('calls app sync provision', async () => {
      const alias = v4()
      const billingAddress = {
        addressLine1: v4(),
        addressLine2: v4(),
        city: v4(),
        state: v4(),
        country: v4(),
        postalCode: v4(),
      }
      const cardHolder = v4()
      const currency = v4()
      const fundingSourceId = v4()
      const ownershipProofs = [v4()]
      await instanceUnderTest.provisionVirtualCard({
        alias,
        billingAddress,
        cardHolder,
        currency,
        fundingSourceId,
        ownershipProofs,
      })
      verify(mockAppSync.provisionVirtualCard(anything())).once()
      const [args] = capture(mockAppSync.provisionVirtualCard).first()
      expect(args).toEqual<typeof args>({
        alias,
        billingAddress,
        cardHolder,
        currency,
        fundingSourceId,
        ownerProofs: ownershipProofs,
        clientRefId: expect.stringMatching(uuidV4Regex()),
        keyRingId: ServiceDataFactory.deviceKey.keyRingId,
      })
    })
  })

  describe('updateVirtualCard', () => {
    beforeEach(() => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(
        ServiceDataFactory.deviceKey,
      )
      when(mockAppSync.updateVirtualCard(anything())).thenResolve(
        GraphQLDataFactory.sealedCard,
      )
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED-STRING',
      )
    })

    it('calls appsync cancel', async () => {
      const id = v4()
      const expectedCardVersion = 10
      const cardHolder = v4()
      const alias = v4()
      const billingAddress = EntityDataFactory.virtualCard
        .billingAddress as VirtualCardBillingAddressEntity
      await instanceUnderTest.updateVirtualCard({
        id,
        expectedCardVersion,
        cardHolder,
        alias,
        billingAddress,
      })
      verify(mockAppSync.updateVirtualCard(anything())).once()
      const [args] = capture(mockAppSync.updateVirtualCard).first()
      expect(args).toEqual<typeof args>({
        id,
        expectedVersion: expectedCardVersion,
        cardHolder,
        alias,
        billingAddress,
      })
    })

    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.updateVirtualCard({
          id: '',
          cardHolder: '',
          alias: '',
          billingAddress: undefined,
        }),
      ).resolves.toEqual({
        status: APIResultStatus.Success,
        result: {
          ...EntityDataFactory.virtualCard,
          cardHolder: 'UNSEALED-STRING',
          alias: 'UNSEALED-STRING',
          pan: 'UNSEALED-STRING',
          csc: 'UNSEALED-STRING',
          billingAddress: {
            addressLine1: 'UNSEALED-STRING',
            addressLine2: 'UNSEALED-STRING',
            city: 'UNSEALED-STRING',
            state: 'UNSEALED-STRING',
            country: 'UNSEALED-STRING',
            postalCode: 'UNSEALED-STRING',
          },
          expiry: {
            mm: 'UNSEALED-STRING',
            yyyy: 'UNSEALED-STRING',
          },
        },
      })
    })
  })

  describe('cancelVirtualCard', () => {
    beforeEach(() => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(
        ServiceDataFactory.deviceKey,
      )
      when(mockAppSync.cancelVirtualCard(anything())).thenResolve(
        GraphQLDataFactory.sealedCard,
      )
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED-STRING',
      )
    })

    it('calls appsync cancel', async () => {
      const id = v4()
      await instanceUnderTest.cancelVirtualCard({ id })
      verify(mockAppSync.cancelVirtualCard(anything())).once()
      const [args] = capture(mockAppSync.cancelVirtualCard).first()
      expect(args).toEqual<typeof args>({
        id,
      })
    })

    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.cancelVirtualCard({ id: '' }),
      ).resolves.toEqual({
        status: APIResultStatus.Success,
        result: {
          ...EntityDataFactory.virtualCard,
          cardHolder: 'UNSEALED-STRING',
          alias: 'UNSEALED-STRING',
          pan: 'UNSEALED-STRING',
          csc: 'UNSEALED-STRING',
          billingAddress: {
            addressLine1: 'UNSEALED-STRING',
            addressLine2: 'UNSEALED-STRING',
            city: 'UNSEALED-STRING',
            state: 'UNSEALED-STRING',
            country: 'UNSEALED-STRING',
            postalCode: 'UNSEALED-STRING',
          },
          expiry: {
            mm: 'UNSEALED-STRING',
            yyyy: 'UNSEALED-STRING',
          },
        },
      })
    })
  })

  describe('getVirtualCard', () => {
    beforeEach(() => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(
        ServiceDataFactory.deviceKey,
      )
      when(mockAppSync.getCard(anything(), anything())).thenResolve(
        GraphQLDataFactory.sealedCard,
      )
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED-STRING',
      )
    })

    it('calls expected methods without lastTransaction', async () => {
      const id = v4()
      await instanceUnderTest.getVirtualCard({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockAppSync.getCard(anything(), anything())).once()
      const [appSyncArgs, appSyncFetchPolicy] = capture(
        mockAppSync.getCard,
      ).first()
      expect(appSyncArgs).toEqual<typeof appSyncArgs>({
        id,
      })
      expect(appSyncFetchPolicy).toEqual('cache-only')
      verify(mockDeviceKeyWorker.unsealString(anything())).atLeast(1)
      verify(mockTransactionWorker.unsealTransaction(anything())).never()
    })

    it('calls expected methods with lastTransaction', async () => {
      when(mockAppSync.getCard(anything(), anything())).thenResolve({
        ...GraphQLDataFactory.sealedCard,
        lastTransaction: GraphQLDataFactory.sealedTransaction,
      })
      const id = v4()
      await instanceUnderTest.getVirtualCard({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockAppSync.getCard(anything(), anything())).once()
      const [appSyncArgs, appSyncFetchPolicy] = capture(
        mockAppSync.getCard,
      ).first()
      expect(appSyncArgs).toEqual<typeof appSyncArgs>({
        id,
      })
      expect(appSyncFetchPolicy).toEqual('cache-only')
      verify(mockDeviceKeyWorker.unsealString(anything())).atLeast(1)
      verify(mockTransactionWorker.unsealTransaction(anything())).once()
    })

    it('returns undefined if appsync returns undefined', async () => {
      when(mockAppSync.getCard(anything(), anything())).thenResolve(undefined)
      await expect(
        instanceUnderTest.getVirtualCard({
          id: '',
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).resolves.toBeUndefined()
    })

    it('returns expected result without lastTransaction', async () => {
      const result = await instanceUnderTest.getVirtualCard({
        id: '',
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(result).toEqual<typeof result>({
        ...EntityDataFactory.virtualCard,
        cardHolder: 'UNSEALED-STRING',
        alias: 'UNSEALED-STRING',
        pan: 'UNSEALED-STRING',
        csc: 'UNSEALED-STRING',
        billingAddress: {
          addressLine1: 'UNSEALED-STRING',
          addressLine2: 'UNSEALED-STRING',
          city: 'UNSEALED-STRING',
          state: 'UNSEALED-STRING',
          country: 'UNSEALED-STRING',
          postalCode: 'UNSEALED-STRING',
        },
        expiry: {
          mm: 'UNSEALED-STRING',
          yyyy: 'UNSEALED-STRING',
        },
      })
    })

    it('returns expected result with lastTransaction', async () => {
      when(mockAppSync.getCard(anything(), anything())).thenResolve({
        ...GraphQLDataFactory.sealedCard,
        lastTransaction: GraphQLDataFactory.sealedTransaction,
      })

      const result = await instanceUnderTest.getVirtualCard({
        id: '',
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(result).toEqual<typeof result>({
        ...EntityDataFactory.virtualCard,
        cardHolder: 'UNSEALED-STRING',
        alias: 'UNSEALED-STRING',
        pan: 'UNSEALED-STRING',
        csc: 'UNSEALED-STRING',
        billingAddress: {
          addressLine1: 'UNSEALED-STRING',
          addressLine2: 'UNSEALED-STRING',
          city: 'UNSEALED-STRING',
          state: 'UNSEALED-STRING',
          country: 'UNSEALED-STRING',
          postalCode: 'UNSEALED-STRING',
        },
        expiry: {
          mm: 'UNSEALED-STRING',
          yyyy: 'UNSEALED-STRING',
        },
        lastTransaction: EntityDataFactory.transaction,
      })
    })
  })

  describe('listVirtualCards', () => {
    const nextToken = v4()

    beforeEach(() => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(
        ServiceDataFactory.deviceKey,
      )
      when(
        mockAppSync.listCards(anything(), anything(), anything(), anything()),
      ).thenResolve({ items: [GraphQLDataFactory.sealedCard], nextToken })
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED-STRING',
      )
    })

    it('calls expected methods', async () => {
      const filter = { id: { eq: v4() } }
      const limit = 4
      const nextToken = v4()
      await instanceUnderTest.listVirtualCards({
        filter,
        limit,
        nextToken,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(
        mockAppSync.listCards(anything(), anything(), anything(), anything()),
      ).once()
      const [
        appSyncFilter,
        appSyncLimit,
        appSyncNextToken,
        appSyncFetchPolicy,
      ] = capture(mockAppSync.listCards).first()
      expect(appSyncFilter).toEqual<typeof appSyncFilter>(filter)
      expect(appSyncLimit).toEqual(limit)
      expect(appSyncNextToken).toEqual(nextToken)
      expect(appSyncFetchPolicy).toEqual('cache-only')
      verify(mockDeviceKeyWorker.unsealString(anything())).atLeast(1)
    })

    it('returns empty list if appsync returns empty list', async () => {
      when(
        mockAppSync.listCards(anything(), anything(), anything(), anything()),
      ).thenResolve({ items: [] })
      await expect(instanceUnderTest.listVirtualCards()).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        items: [],
        nextToken: undefined,
      })
    })

    it('returns expected result', async () => {
      const result = await instanceUnderTest.listVirtualCards()
      expect(result).toEqual<typeof result>({
        status: ListOperationResultStatus.Success,
        items: [
          {
            ...EntityDataFactory.virtualCard,
            cardHolder: 'UNSEALED-STRING',
            alias: 'UNSEALED-STRING',
            pan: 'UNSEALED-STRING',
            csc: 'UNSEALED-STRING',
            billingAddress: {
              addressLine1: 'UNSEALED-STRING',
              addressLine2: 'UNSEALED-STRING',
              city: 'UNSEALED-STRING',
              state: 'UNSEALED-STRING',
              country: 'UNSEALED-STRING',
              postalCode: 'UNSEALED-STRING',
            },
            expiry: {
              mm: 'UNSEALED-STRING',
              yyyy: 'UNSEALED-STRING',
            },
          },
        ],
        nextToken,
      })
    })

    it('returns expected result with lastTransaction', async () => {
      when(
        mockAppSync.listCards(anything(), anything(), anything(), anything()),
      ).thenResolve({
        items: [
          {
            ...GraphQLDataFactory.sealedCard,
            lastTransaction: GraphQLDataFactory.sealedTransaction,
          },
        ],
        nextToken,
      })

      const result = await instanceUnderTest.listVirtualCards()
      expect(result).toEqual<typeof result>({
        status: ListOperationResultStatus.Success,
        items: [
          {
            ...EntityDataFactory.virtualCard,
            cardHolder: 'UNSEALED-STRING',
            alias: 'UNSEALED-STRING',
            pan: 'UNSEALED-STRING',
            csc: 'UNSEALED-STRING',
            billingAddress: {
              addressLine1: 'UNSEALED-STRING',
              addressLine2: 'UNSEALED-STRING',
              city: 'UNSEALED-STRING',
              state: 'UNSEALED-STRING',
              country: 'UNSEALED-STRING',
              postalCode: 'UNSEALED-STRING',
            },
            expiry: {
              mm: 'UNSEALED-STRING',
              yyyy: 'UNSEALED-STRING',
            },
            lastTransaction: EntityDataFactory.transaction,
          },
        ],
        nextToken,
      })
    })

    it('returns partial results when all unsealing fails', async () => {
      when(
        mockAppSync.listCards(anything(), anything(), anything(), anything()),
      ).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedCard, id: '1' },
          { ...GraphQLDataFactory.sealedCard, id: '2' },
        ],
      })
      when(mockDeviceKeyWorker.unsealString(anything())).thenReject(
        new Error('failed to unseal 1'),
        new Error('failed to unseal 2'),
      )
      await expect(instanceUnderTest.listVirtualCards()).resolves.toEqual({
        status: ListOperationResultStatus.Partial,
        nextToken: undefined,
        items: [],
        failed: [
          {
            item: generatePartialVirtualCard({
              ...EntityDataFactory.virtualCard,
              id: '1',
            }),
            cause: new Error('failed to unseal 1'),
          },
          {
            item: generatePartialVirtualCard({
              ...EntityDataFactory.virtualCard,
              id: '2',
            }),
            cause: new Error('failed to unseal 2'),
          },
        ],
      })
    })

    it('returns partial results when some unsealing fails', async () => {
      when(
        mockAppSync.listCards(anything(), anything(), anything(), anything()),
      ).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedCard, id: '1' },
          { ...GraphQLDataFactory.sealedCard, id: '2' },
        ],
      })
      when(mockDeviceKeyWorker.unsealString(anything()))
        .thenReject(new Error('failed to unseal 1'))
        .thenResolve('UNSEALED-STRING')
      const failedCard = generatePartialVirtualCard(
        EntityDataFactory.virtualCard,
      )
      await expect(instanceUnderTest.listVirtualCards()).resolves.toEqual({
        status: ListOperationResultStatus.Partial,
        nextToken: undefined,
        items: [
          {
            ...EntityDataFactory.virtualCard,
            id: '2',
            cardHolder: 'UNSEALED-STRING',
            alias: 'UNSEALED-STRING',
            pan: 'UNSEALED-STRING',
            csc: 'UNSEALED-STRING',
            billingAddress: {
              addressLine1: 'UNSEALED-STRING',
              addressLine2: 'UNSEALED-STRING',
              city: 'UNSEALED-STRING',
              state: 'UNSEALED-STRING',
              country: 'UNSEALED-STRING',
              postalCode: 'UNSEALED-STRING',
            },
            expiry: {
              mm: 'UNSEALED-STRING',
              yyyy: 'UNSEALED-STRING',
            },
          },
        ],
        failed: [
          {
            cause: new Error('failed to unseal 1'),
            item: { ...failedCard, id: '1' },
          },
        ],
      })
    })
  })

  describe('getProvisionalCard', () => {
    beforeEach(() => {
      when(mockAppSync.getProvisionalCard(anything(), anything())).thenResolve({
        ...GraphQLDataFactory.provisionalCard,
        card: [{ ...GraphQLDataFactory.sealedCard }],
      })
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED-STRING',
      )
      when(mockDeviceKeyWorker.keyExists(anything(), anything())).thenResolve(
        true,
      )
    })

    it('calls expected methods', async () => {
      const id = v4()
      await instanceUnderTest.getProvisionalCard({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockAppSync.getProvisionalCard(anything(), anything())).once()
      const [appSyncArgs, appSyncFetchPolicy] = capture(
        mockAppSync.getProvisionalCard,
      ).first()
      expect(appSyncArgs).toEqual<typeof appSyncArgs>(id)
      expect(appSyncFetchPolicy).toEqual('cache-only')
      verify(mockDeviceKeyWorker.unsealString(anything())).atLeast(1)
    })

    it('returns undefined if appsync returns undefined', async () => {
      when(mockAppSync.getProvisionalCard(anything(), anything())).thenResolve(
        undefined,
      )
      await expect(
        instanceUnderTest.getProvisionalCard({
          id: '',
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).resolves.toBeUndefined()
    })

    it('returns expected result', async () => {
      const result = await instanceUnderTest.getProvisionalCard({
        id: '',
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(result).toEqual<typeof result>({
        ...EntityDataFactory.provisionalVirtualCard,
        card: {
          ...EntityDataFactory.virtualCard,
          cardHolder: 'UNSEALED-STRING',
          alias: 'UNSEALED-STRING',
          pan: 'UNSEALED-STRING',
          csc: 'UNSEALED-STRING',
          billingAddress: {
            addressLine1: 'UNSEALED-STRING',
            addressLine2: 'UNSEALED-STRING',
            city: 'UNSEALED-STRING',
            state: 'UNSEALED-STRING',
            country: 'UNSEALED-STRING',
            postalCode: 'UNSEALED-STRING',
          },
          expiry: {
            mm: 'UNSEALED-STRING',
            yyyy: 'UNSEALED-STRING',
          },
        },
      })
    })
  })

  describe('listProvisionalCards', () => {
    const nextToken = v4()

    beforeEach(() => {
      when(
        mockAppSync.listProvisionalCards(
          anything(),
          anything(),
          anything(),
          anything(),
        ),
      ).thenResolve({
        items: [
          {
            ...GraphQLDataFactory.provisionalCard,
            card: [{ ...GraphQLDataFactory.sealedCard }],
          },
        ],
        nextToken,
      })
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED-STRING',
      )
      when(mockDeviceKeyWorker.keyExists(anything(), anything())).thenResolve(
        true,
      )
    })

    it('calls expected methods', async () => {
      const filter = { id: { eq: v4() } }
      const limit = 4
      const nextToken = v4()
      await instanceUnderTest.listProvisionalCards({
        filter,
        limit,
        nextToken,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(
        mockAppSync.listProvisionalCards(
          anything(),
          anything(),
          anything(),
          anything(),
        ),
      ).once()
      const [
        appSyncFilter,
        appSyncLimit,
        appSyncNextToken,
        appSyncFetchPolicy,
      ] = capture(mockAppSync.listProvisionalCards).first()
      expect(appSyncFilter).toEqual<typeof appSyncFilter>(filter)
      expect(appSyncLimit).toEqual(limit)
      expect(appSyncNextToken).toEqual(nextToken)
      expect(appSyncFetchPolicy).toEqual('cache-only')
      verify(mockDeviceKeyWorker.unsealString(anything())).atLeast(1)
    })

    it('returns empty list if appsync returns empty list', async () => {
      when(
        mockAppSync.listProvisionalCards(
          anything(),
          anything(),
          anything(),
          anything(),
        ),
      ).thenResolve({ items: [] })
      await expect(instanceUnderTest.listProvisionalCards()).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        items: [],
        nextToken: undefined,
      })
    })

    it('returns expected result', async () => {
      const result = await instanceUnderTest.listProvisionalCards()
      expect(result).toEqual<typeof result>({
        status: ListOperationResultStatus.Success,
        items: [
          {
            ...EntityDataFactory.provisionalVirtualCard,
            card: {
              ...EntityDataFactory.virtualCard,
              cardHolder: 'UNSEALED-STRING',
              alias: 'UNSEALED-STRING',
              pan: 'UNSEALED-STRING',
              csc: 'UNSEALED-STRING',
              billingAddress: {
                addressLine1: 'UNSEALED-STRING',
                addressLine2: 'UNSEALED-STRING',
                city: 'UNSEALED-STRING',
                state: 'UNSEALED-STRING',
                country: 'UNSEALED-STRING',
                postalCode: 'UNSEALED-STRING',
              },
              expiry: {
                mm: 'UNSEALED-STRING',
                yyyy: 'UNSEALED-STRING',
              },
            },
          },
        ],
        nextToken,
      })
    })

    it('returns partial KeyNotFoundError when key cannot be found for sealed card', async () => {
      when(mockDeviceKeyWorker.keyExists(anything(), anything())).thenResolve(
        false,
      )
      await expect(instanceUnderTest.listProvisionalCards()).resolves.toEqual({
        status: ListOperationResultStatus.Partial,
        nextToken,
        items: [],
        failed: [
          {
            item: generatePartialProvisionalCard(
              EntityDataFactory.provisionalVirtualCard,
            ),
            cause: new KeyNotFoundError(),
          },
        ],
      })
    })

    it('returns partial when card fails to unseal', async () => {
      const error = new Error(v4())
      when(mockDeviceKeyWorker.unsealString(anything())).thenReject(error)
      await expect(instanceUnderTest.listProvisionalCards()).resolves.toEqual({
        status: ListOperationResultStatus.Partial,
        nextToken,
        items: [],
        failed: [
          {
            item: generatePartialProvisionalCard(
              EntityDataFactory.provisionalVirtualCard,
            ),
            cause: error,
          },
        ],
      })
    })
  })

  describe('getPublicKeyOrRegisterNewKey', () => {
    beforeEach(() => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(
        ServiceDataFactory.deviceKey,
      )
      when(mockDeviceKeyWorker.generateKeyPair()).thenResolve(
        ServiceDataFactory.deviceKey,
      )
      when(mockAppSync.getKeyRing(anything())).thenResolve({
        items: [GraphQLDataFactory.publicKey],
      })
    })
    it("generates a new key when key doesn't exist", async () => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(undefined)
      await instanceUnderTest.getPublicKeyOrRegisterNewKey()
      verify(mockDeviceKeyWorker.generateKeyPair()).once()
    })

    it('checks that key is registered when key locally exists', async () => {
      await instanceUnderTest.getPublicKeyOrRegisterNewKey()
      verify(mockAppSync.getKeyRing(anything())).once()
      const [args] = capture(mockAppSync.getKeyRing).first()
      expect(args).toEqual<typeof args>({
        keyRingId: ServiceDataFactory.deviceKey.keyRingId,
        keyFormats: [KeyFormat.RsaPublicKey],
      })
    })

    it('registers newly created key when first created', async () => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(undefined)
      await instanceUnderTest.getPublicKeyOrRegisterNewKey()
      verify(mockAppSync.createPublicKey(anything())).once()
    })

    it('registers local key when key is not registered to service', async () => {
      when(mockAppSync.getKeyRing(anything())).thenResolve({
        items: [],
      })
      await instanceUnderTest.getPublicKeyOrRegisterNewKey()
      verify(mockAppSync.createPublicKey(anything())).once()
    })

    it('does not register when key is already registered', async () => {
      when(mockAppSync.getKeyRing(anything())).thenResolve({
        items: [
          {
            ...GraphQLDataFactory.publicKey,
            keyId: ServiceDataFactory.deviceKey.id,
            keyRingId: ServiceDataFactory.deviceKey.keyRingId,
          },
        ],
      })
      await instanceUnderTest.getPublicKeyOrRegisterNewKey()
      verify(mockAppSync.createPublicKey(anything())).never()
    })
  })

  describe('unsealVirtualCard', () => {
    it('unseals correctly without last transaction', async () => {
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED_STRING',
      )
      await expect(
        instanceUnderTest.unsealVirtualCard({
          ...GraphQLDataFactory.sealedCard,
          cancelledAtEpochMs: 1.0,
        }),
      ).resolves.toMatchObject({
        cardHolder: 'UNSEALED_STRING',
        alias: 'UNSEALED_STRING',
        pan: 'UNSEALED_STRING',
        csc: 'UNSEALED_STRING',
        billingAddress: {
          addressLine1: 'UNSEALED_STRING',
          addressLine2: 'UNSEALED_STRING',
          city: 'UNSEALED_STRING',
          state: 'UNSEALED_STRING',
          country: 'UNSEALED_STRING',
          postalCode: 'UNSEALED_STRING',
        },
        expiry: {
          mm: 'UNSEALED_STRING',
          yyyy: 'UNSEALED_STRING',
        },
      })
    })

    it('unseals correctly with last transaction', async () => {
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED_STRING',
      )

      await expect(
        instanceUnderTest.unsealVirtualCard({
          ...GraphQLDataFactory.sealedCard,
          cancelledAtEpochMs: 1.0,
          lastTransaction: GraphQLDataFactory.sealedTransaction,
        }),
      ).resolves.toMatchObject({
        cardHolder: 'UNSEALED_STRING',
        alias: 'UNSEALED_STRING',
        pan: 'UNSEALED_STRING',
        csc: 'UNSEALED_STRING',
        billingAddress: {
          addressLine1: 'UNSEALED_STRING',
          addressLine2: 'UNSEALED_STRING',
          city: 'UNSEALED_STRING',
          state: 'UNSEALED_STRING',
          country: 'UNSEALED_STRING',
          postalCode: 'UNSEALED_STRING',
        },
        expiry: {
          mm: 'UNSEALED_STRING',
          yyyy: 'UNSEALED_STRING',
        },
      })
    })

    it('handles undefined values', async () => {
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED_STRING',
      )
      await expect(
        instanceUnderTest.unsealVirtualCard({
          ...GraphQLDataFactory.sealedCard,
          cancelledAtEpochMs: undefined,
          billingAddress: {
            ...GraphQLDataFactory.sealedCard.billingAddress!,
            addressLine2: undefined,
          },
        }),
      ).resolves.toMatchObject({
        cancelledAtEpochMs: undefined,
        billingAddress: expect.objectContaining({ addressLine2: undefined }),
      })
    })

    it('handles undefined billing address', async () => {
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED_STRING',
      )
      await expect(
        instanceUnderTest.unsealVirtualCard({
          ...GraphQLDataFactory.sealedCard,
          billingAddress: undefined,
        }),
      ).resolves.toMatchObject({
        billingAddress: undefined,
      })
    })
  })
})
