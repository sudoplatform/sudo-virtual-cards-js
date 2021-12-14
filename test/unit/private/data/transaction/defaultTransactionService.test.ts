import {
  CachePolicy,
  ListOperationResultStatus,
} from '@sudoplatform/sudo-common'
import {
  anything,
  capture,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when,
} from 'ts-mockito'
import { v4 } from 'uuid'
import { DeclineReason, SortOrder } from '../../../../../src'
import { ApiClient } from '../../../../../src/private/data/common/apiClient'
import { DeviceKeyWorker } from '../../../../../src/private/data/common/deviceKeyWorker'
import { DefaultTransactionService } from '../../../../../src/private/data/transaction/defaultTransactionService'
import { TransactionSealedAttributes } from '../../../../../src/private/data/transaction/transactionSealedAttributes'
import { TransactionEntity } from '../../../../../src/private/domain/entities/transaction/transactionEntity'
import { EntityDataFactory } from '../../../data-factory/entity'
import { GraphQLDataFactory } from '../../../data-factory/graphQl'
import { ServiceDataFactory } from '../../../data-factory/service'

describe('DefaultTransactionService Test Suite', () => {
  let instanceUnderTest: DefaultTransactionService
  const mockAppSync = mock<ApiClient>()
  const mockDeviceKeyWorker = mock<DeviceKeyWorker>()

  beforeEach(() => {
    reset(mockAppSync)
    reset(mockDeviceKeyWorker)
    instanceUnderTest = new DefaultTransactionService(
      instance(mockAppSync),
      instance(mockDeviceKeyWorker),
    )
  })

  const generatePartialTransaction = (
    entity: TransactionEntity,
  ): Omit<TransactionEntity, keyof TransactionSealedAttributes> => {
    const _transaction = entity as any
    delete _transaction.billedAmount
    delete _transaction.transactedAmount
    delete _transaction.description
    delete _transaction.transactedAtEpochMs
    delete _transaction.transactedAt
    delete _transaction.declineReason
    delete _transaction.detail
    return _transaction as Omit<
      TransactionEntity,
      keyof TransactionSealedAttributes
    >
  }

  describe('getTransaction', () => {
    beforeEach(() => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(
        ServiceDataFactory.deviceKey,
      )
      when(mockAppSync.getTransaction(anything(), anything())).thenResolve(
        GraphQLDataFactory.sealedTransaction,
      )
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED-STRING',
      )
      // Required as decline reason needs to match a true decline reason
      when(
        mockDeviceKeyWorker.unsealString(
          objectContaining({
            encrypted: GraphQLDataFactory.sealedTransaction.declineReason,
          }),
        ),
      ).thenResolve(DeclineReason.Declined)
      when(
        mockDeviceKeyWorker.unsealString(
          objectContaining({
            encrypted: 'SEALED-NUMBER',
          }),
        ),
      ).thenResolve('100')
    })

    it('calls expected methods', async () => {
      const id = v4()
      await instanceUnderTest.getTransaction({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockAppSync.getTransaction(anything(), anything())).once()
      const [appSyncArgs, appSyncFetchPolicy] = capture(
        mockAppSync.getTransaction,
      ).first()
      expect(appSyncArgs).toStrictEqual<typeof appSyncArgs>({ id })
      expect(appSyncFetchPolicy).toStrictEqual('cache-only')
      verify(mockDeviceKeyWorker.unsealString(anything())).atLeast(1)
    })
    it('returns undefined if appsync returns undefined', async () => {
      when(mockAppSync.getTransaction(anything(), anything())).thenResolve(
        undefined,
      )
      await expect(
        instanceUnderTest.getTransaction({
          id: '',
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).resolves.toBeUndefined()
    })
    it('returns expected result', async () => {
      const result = await instanceUnderTest.getTransaction({
        id: '',
        cachePolicy: CachePolicy.CacheOnly,
      })
      const currencyAmount = { amount: 100, currency: 'UNSEALED-STRING' }
      expect(result).toStrictEqual<typeof result>({
        ...EntityDataFactory.transaction,
        description: 'UNSEALED-STRING',
        billedAmount: currencyAmount,
        detail: [
          {
            ...EntityDataFactory.transaction.detail![0],
            description: 'UNSEALED-STRING',
            fundingSourceAmount: currencyAmount,
            markupAmount: currencyAmount,
            virtualCardAmount: currencyAmount,
          },
        ],
        transactedAmount: currencyAmount,
      })
    })
  })
  describe('listTransactionsByCardId', () => {
    beforeEach(() => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(
        ServiceDataFactory.deviceKey,
      )
      when(
        mockAppSync.listTransactionsByCardId(anything(), anything()),
      ).thenResolve({
        items: [GraphQLDataFactory.sealedTransaction],
        nextToken: undefined,
      })
      when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
        'UNSEALED-STRING',
      )
      // Required as decline reason needs to match a true decline reason
      when(
        mockDeviceKeyWorker.unsealString(
          objectContaining({
            encrypted: GraphQLDataFactory.sealedTransaction.declineReason,
          }),
        ),
      ).thenResolve(DeclineReason.Declined)
      when(
        mockDeviceKeyWorker.unsealString(
          objectContaining({
            encrypted: 'SEALED-NUMBER',
          }),
        ),
      ).thenResolve('100')
    })

    it('calls expected methods', async () => {
      const cardId = v4()
      const cachePolicy = CachePolicy.CacheOnly
      const filter = { id: { eq: v4() } }
      const limit = 4
      const nextToken = v4()
      const dateRange = { startDate: new Date(), endDate: new Date() }
      const sortOrder = SortOrder.Asc
      await instanceUnderTest.listTransactionsByCardId({
        cardId,
        cachePolicy,
        filter,
        limit,
        nextToken,
        dateRange,
        sortOrder,
      })
      verify(
        mockAppSync.listTransactionsByCardId(anything(), anything()),
      ).once()
      const [appSyncArgs, fetchPolicy] = capture(
        mockAppSync.listTransactionsByCardId,
      ).first()
      expect(appSyncArgs).toStrictEqual<typeof appSyncArgs>({
        cardId,
        filter,
        limit,
        nextToken,
        dateRange: {
          startDateEpochMs: dateRange.startDate.getTime(),
          endDateEpochMs: dateRange.endDate.getTime(),
        },
        sortOrder,
      })
      expect(fetchPolicy).toStrictEqual<typeof fetchPolicy>('cache-only')
      verify(mockDeviceKeyWorker.unsealString(anything())).atLeast(1)
    })
    it('returns empty list if appsync returns empty list', async () => {
      when(
        mockAppSync.listTransactionsByCardId(anything(), anything()),
      ).thenResolve({ items: [] })
      await expect(
        instanceUnderTest.listTransactionsByCardId({ cardId: '' }),
      ).resolves.toStrictEqual({
        status: ListOperationResultStatus.Success,
        items: [],
        nextToken: undefined,
      })
    })
    it('returns expected result', async () => {
      const result = await instanceUnderTest.listTransactionsByCardId({
        cardId: '',
      })
      const currencyAmount = { amount: 100, currency: 'UNSEALED-STRING' }
      expect(result).toStrictEqual<typeof result>({
        status: ListOperationResultStatus.Success,
        nextToken: undefined,
        items: [
          {
            ...EntityDataFactory.transaction,
            description: 'UNSEALED-STRING',
            billedAmount: currencyAmount,
            detail: [
              {
                ...EntityDataFactory.transaction.detail![0],
                description: 'UNSEALED-STRING',
                fundingSourceAmount: currencyAmount,
                markupAmount: currencyAmount,
                virtualCardAmount: currencyAmount,
              },
            ],
            transactedAmount: currencyAmount,
          },
        ],
      })
    })
    it('returns partial results when all unsealing fails', async () => {
      when(
        mockAppSync.listTransactionsByCardId(anything(), anything()),
      ).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedTransaction, id: '1' },
          { ...GraphQLDataFactory.sealedTransaction, id: '2' },
        ],
      })
      when(mockDeviceKeyWorker.unsealString(anything())).thenReject(
        new Error('failed to unseal 1'),
        new Error('failed to unseal 2'),
      )
      await expect(
        instanceUnderTest.listTransactionsByCardId({ cardId: '' }),
      ).resolves.toStrictEqual({
        status: ListOperationResultStatus.Partial,
        nextToken: undefined,
        items: [],
        failed: [
          {
            item: generatePartialTransaction({
              ...EntityDataFactory.transaction,
              id: '1',
            }),
            cause: new Error('failed to unseal 1'),
          },
          {
            item: generatePartialTransaction({
              ...EntityDataFactory.transaction,
              id: '2',
            }),
            cause: new Error('failed to unseal 2'),
          },
        ],
      })
    })
    it('returns partial results when some unsealing fails', async () => {
      when(
        mockAppSync.listTransactionsByCardId(anything(), anything()),
      ).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedTransaction, id: '1' },
          { ...GraphQLDataFactory.sealedTransaction, id: '2' },
        ],
      })
      when(mockDeviceKeyWorker.unsealString(anything()))
        .thenReject(new Error('failed to unseal 1'))
        .thenResolve('UNSEALED-STRING')
      when(
        mockDeviceKeyWorker.unsealString(
          objectContaining({
            encrypted: GraphQLDataFactory.sealedTransaction.declineReason,
          }),
        ),
      ).thenResolve(DeclineReason.Declined)
      when(
        mockDeviceKeyWorker.unsealString(
          objectContaining({
            encrypted: 'SEALED-NUMBER',
          }),
        ),
      ).thenResolve('100')
      const currencyAmount = { amount: 100, currency: 'UNSEALED-STRING' }
      await expect(
        instanceUnderTest.listTransactionsByCardId({ cardId: '' }),
      ).resolves.toStrictEqual({
        status: ListOperationResultStatus.Partial,
        nextToken: undefined,
        items: [
          {
            ...EntityDataFactory.transaction,
            id: '2',
            description: 'UNSEALED-STRING',
            billedAmount: currencyAmount,
            detail: [
              {
                ...EntityDataFactory.transaction.detail![0],
                description: 'UNSEALED-STRING',
                fundingSourceAmount: currencyAmount,
                markupAmount: currencyAmount,
                virtualCardAmount: currencyAmount,
              },
            ],
            transactedAmount: currencyAmount,
          },
        ],
        failed: [
          {
            item: generatePartialTransaction({
              ...EntityDataFactory.transaction,
              id: '1',
            }),
            cause: new Error('failed to unseal 1'),
          },
        ],
      })
    })
  })
})
