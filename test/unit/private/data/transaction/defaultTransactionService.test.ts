/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CachePolicy,
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
import { SortOrder, TransactionType } from '../../../../../src'
import { ApiClient } from '../../../../../src/private/data/common/apiClient'
import { TransactionWorker } from '../../../../../src/private/data/common/transactionWorker'
import { DefaultTransactionService } from '../../../../../src/private/data/transaction/defaultTransactionService'
import { TransactionSealedAttributes } from '../../../../../src/private/data/transaction/transactionSealedAttributes'
import { TransactionEntity } from '../../../../../src/private/domain/entities/transaction/transactionEntity'
import { EntityDataFactory } from '../../../data-factory/entity'
import { GraphQLDataFactory } from '../../../data-factory/graphQl'
import { ServiceDataFactory } from '../../../data-factory/service'

describe('DefaultTransactionService Test Suite', () => {
  let instanceUnderTest: DefaultTransactionService
  const mockAppSync = mock<ApiClient>()
  const mockTransactionWorker = mock<TransactionWorker>()

  beforeEach(() => {
    reset(mockAppSync)
    reset(mockTransactionWorker)

    instanceUnderTest = new DefaultTransactionService(
      instance(mockAppSync),
      instance(mockTransactionWorker),
    )

    when(mockTransactionWorker.unsealTransaction(anything())).thenResolve(
      ServiceDataFactory.transactionUnsealed,
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
    delete _transaction.settledAt
    delete _transaction.declineReason
    delete _transaction.detail
    return _transaction as Omit<
      TransactionEntity,
      keyof TransactionSealedAttributes
    >
  }

  describe('getTransaction', () => {
    beforeEach(() => {
      when(mockAppSync.getTransaction(anything(), anything())).thenResolve(
        GraphQLDataFactory.sealedTransaction,
      )
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
      verify(mockTransactionWorker.unsealTransaction(anything())).atLeast(1)
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

    it('returns expected pending transaction result', async () => {
      const result = await instanceUnderTest.getTransaction({
        id: '',
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(result).toEqual<typeof result>(EntityDataFactory.transaction)
    })

    it('returns expected settled transaction result', async () => {
      when(mockAppSync.getTransaction(anything(), anything())).thenResolve(
        GraphQLDataFactory.sealedSettledTransaction,
      )
      when(mockTransactionWorker.unsealTransaction(anything())).thenResolve(
        ServiceDataFactory.settledTransactionUnsealed,
      )
      const result = await instanceUnderTest.getTransaction({
        id: '',
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(result).toEqual<typeof result>(
        EntityDataFactory.settledTransaction,
      )
    })
  })

  describe('listTransactions', () => {
    beforeEach(() => {
      when(mockAppSync.listTransactions(anything(), anything())).thenResolve({
        items: [GraphQLDataFactory.sealedTransaction],
        nextToken: undefined,
      })
    })

    it('calls expected methods', async () => {
      const cachePolicy = CachePolicy.CacheOnly
      const limit = 4
      const nextToken = v4()
      const dateRange = { startDate: new Date(), endDate: new Date() }
      const sortOrder = SortOrder.Asc
      await instanceUnderTest.listTransactions({
        cachePolicy,
        limit,
        nextToken,
        dateRange,
        sortOrder,
      })
      verify(mockAppSync.listTransactions(anything(), anything())).once()
      const [appSyncArgs, fetchPolicy] = capture(
        mockAppSync.listTransactions,
      ).first()
      expect(appSyncArgs).toEqual<typeof appSyncArgs>({
        limit,
        nextToken,
        dateRange: {
          startDateEpochMs: dateRange.startDate.getTime(),
          endDateEpochMs: dateRange.endDate.getTime(),
        },
        sortOrder,
      })
      expect(fetchPolicy).toEqual<typeof fetchPolicy>('cache-only')
      verify(mockTransactionWorker.unsealTransaction(anything())).atLeast(1)
    })

    it('returns empty list if appsync returns empty list', async () => {
      when(mockAppSync.listTransactions(anything(), anything())).thenResolve({
        items: [],
      })
      await expect(
        instanceUnderTest.listTransactions({}),
      ).resolves.toStrictEqual({
        status: ListOperationResultStatus.Success,
        items: [],
        nextToken: undefined,
      })
    })

    it('returns expected result', async () => {
      const result = await instanceUnderTest.listTransactions({})
      expect(result).toEqual<typeof result>({
        status: ListOperationResultStatus.Success,
        nextToken: undefined,
        items: [EntityDataFactory.transaction],
      })
    })

    it('returns partial results when all unsealing fails', async () => {
      when(mockAppSync.listTransactions(anything(), anything())).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedTransaction, id: '1' },
          { ...GraphQLDataFactory.sealedTransaction, id: '2' },
        ],
      })
      when(mockTransactionWorker.unsealTransaction(anything())).thenReject(
        new Error('failed to unseal 1'),
        new Error('failed to unseal 2'),
      )

      await expect(instanceUnderTest.listTransactions({})).resolves.toEqual({
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
      when(mockAppSync.listTransactions(anything(), anything())).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedTransaction, id: '1' },
          { ...GraphQLDataFactory.sealedTransaction, id: '2' },
        ],
      })
      when(mockTransactionWorker.unsealTransaction(anything()))
        .thenReject(new Error('failed to unseal 1'))
        .thenResolve({ ...ServiceDataFactory.transactionUnsealed, id: '2' })

      await expect(instanceUnderTest.listTransactions({})).resolves.toEqual({
        status: ListOperationResultStatus.Partial,
        nextToken: undefined,
        items: [
          {
            ...EntityDataFactory.transaction,
            id: '2',
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

    it('succeeds when at least one instance of sealed transaction can be unsealed', async () => {
      when(mockAppSync.listTransactions(anything(), anything())).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedTransaction, id: '1', keyId: 'key-1' },
          { ...GraphQLDataFactory.sealedTransaction, id: '1', keyId: 'key-2' },
        ],
      })
      when(mockTransactionWorker.unsealTransaction(anything()))
        .thenReject(new Error('failed to unseal key-1'))
        .thenResolve({
          ...ServiceDataFactory.transactionUnsealed,
          id: '1',
        })

      await expect(instanceUnderTest.listTransactions({})).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        nextToken: undefined,
        items: [
          {
            ...EntityDataFactory.transaction,
            id: '1',
          },
        ],
      })
    })

    it('returns only a single instance of a transaction sealed with multiple keys', async () => {
      when(mockAppSync.listTransactions(anything(), anything())).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedTransaction, id: '1', keyId: 'key-1' },
          { ...GraphQLDataFactory.sealedTransaction, id: '1', keyId: 'key-2' },
        ],
      })
      when(mockTransactionWorker.unsealTransaction(anything())).thenResolve({
        ...ServiceDataFactory.transactionUnsealed,
        id: '1',
      })

      await expect(instanceUnderTest.listTransactions({})).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        nextToken: undefined,
        items: [
          {
            ...EntityDataFactory.transaction,
            id: '1',
          },
        ],
      })
    })
  })
  describe('listTransactionsByCardId', () => {
    beforeEach(() => {
      when(
        mockAppSync.listTransactionsByCardId(anything(), anything()),
      ).thenResolve({
        items: [GraphQLDataFactory.sealedTransaction],
        nextToken: undefined,
      })
    })

    it('calls expected methods', async () => {
      const cardId = v4()
      const cachePolicy = CachePolicy.CacheOnly
      const limit = 4
      const nextToken = v4()
      const dateRange = { startDate: new Date(), endDate: new Date() }
      const sortOrder = SortOrder.Asc
      await instanceUnderTest.listTransactionsByCardId({
        cardId,
        cachePolicy,
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
      expect(appSyncArgs).toEqual<typeof appSyncArgs>({
        cardId,
        limit,
        nextToken,
        dateRange: {
          startDateEpochMs: dateRange.startDate.getTime(),
          endDateEpochMs: dateRange.endDate.getTime(),
        },
        sortOrder,
      })
      expect(fetchPolicy).toEqual<typeof fetchPolicy>('cache-only')
      verify(mockTransactionWorker.unsealTransaction(anything())).atLeast(1)
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
      expect(result).toEqual<typeof result>({
        status: ListOperationResultStatus.Success,
        nextToken: undefined,
        items: [EntityDataFactory.transaction],
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
      when(mockTransactionWorker.unsealTransaction(anything())).thenReject(
        new Error('failed to unseal 1'),
        new Error('failed to unseal 2'),
      )

      await expect(
        instanceUnderTest.listTransactionsByCardId({ cardId: '' }),
      ).resolves.toEqual({
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
      when(mockTransactionWorker.unsealTransaction(anything()))
        .thenReject(new Error('failed to unseal 1'))
        .thenResolve({ ...ServiceDataFactory.transactionUnsealed, id: '2' })

      await expect(
        instanceUnderTest.listTransactionsByCardId({ cardId: '' }),
      ).resolves.toEqual({
        status: ListOperationResultStatus.Partial,
        nextToken: undefined,
        items: [
          {
            ...EntityDataFactory.transaction,
            id: '2',
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

    it('succeeds when at least one instance of sealed transaction can be unsealed', async () => {
      when(
        mockAppSync.listTransactionsByCardId(anything(), anything()),
      ).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedTransaction, id: '1', keyId: 'key-1' },
          { ...GraphQLDataFactory.sealedTransaction, id: '1', keyId: 'key-2' },
        ],
      })
      when(mockTransactionWorker.unsealTransaction(anything()))
        .thenReject(new Error('failed to unseal key-1'))
        .thenResolve({
          ...ServiceDataFactory.transactionUnsealed,
          id: '1',
        })

      await expect(
        instanceUnderTest.listTransactionsByCardId({ cardId: '' }),
      ).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        nextToken: undefined,
        items: [
          {
            ...EntityDataFactory.transaction,
            id: '1',
          },
        ],
      })
    })

    it('returns only a single instance of a transaction sealed with multiple keys', async () => {
      when(
        mockAppSync.listTransactionsByCardId(anything(), anything()),
      ).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedTransaction, id: '1', keyId: 'key-1' },
          { ...GraphQLDataFactory.sealedTransaction, id: '1', keyId: 'key-2' },
        ],
      })
      when(mockTransactionWorker.unsealTransaction(anything())).thenResolve({
        ...ServiceDataFactory.transactionUnsealed,
        id: '1',
      })

      await expect(
        instanceUnderTest.listTransactionsByCardId({ cardId: '' }),
      ).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        nextToken: undefined,
        items: [
          {
            ...EntityDataFactory.transaction,
            id: '1',
          },
        ],
      })
    })
  })

  describe('listTransactionsByCardIdAndType', () => {
    beforeEach(() => {
      when(
        mockAppSync.listTransactionsByCardIdAndType(anything(), anything()),
      ).thenResolve({
        items: [GraphQLDataFactory.sealedTransaction],
        nextToken: undefined,
      })
    })

    it('calls expected methods', async () => {
      const cardId = v4()
      const transactionType = TransactionType.Pending
      const cachePolicy = CachePolicy.CacheOnly
      const limit = 4
      const nextToken = v4()
      await instanceUnderTest.listTransactionsByCardIdAndType({
        cardId,
        transactionType,
        cachePolicy,
        limit,
        nextToken,
      })
      verify(
        mockAppSync.listTransactionsByCardIdAndType(anything(), anything()),
      ).once()
      const [appSyncArgs, fetchPolicy] = capture(
        mockAppSync.listTransactionsByCardIdAndType,
      ).first()
      expect(appSyncArgs).toEqual<typeof appSyncArgs>({
        cardId,
        transactionType,
        limit,
        nextToken,
      })
      expect(fetchPolicy).toEqual<typeof fetchPolicy>('cache-only')
      verify(mockTransactionWorker.unsealTransaction(anything())).atLeast(1)
    })

    it('returns empty list if appsync returns empty list', async () => {
      when(
        mockAppSync.listTransactionsByCardIdAndType(anything(), anything()),
      ).thenResolve({ items: [] })
      await expect(
        instanceUnderTest.listTransactionsByCardIdAndType({
          cardId: '',
          transactionType: TransactionType.Pending,
        }),
      ).resolves.toStrictEqual({
        status: ListOperationResultStatus.Success,
        items: [],
        nextToken: undefined,
      })
    })

    it('returns expected result', async () => {
      const result = await instanceUnderTest.listTransactionsByCardIdAndType({
        cardId: '',
        transactionType: TransactionType.Pending,
      })
      expect(result).toEqual<typeof result>({
        status: ListOperationResultStatus.Success,
        nextToken: undefined,
        items: [EntityDataFactory.transaction],
      })
    })

    it('returns partial results when all unsealing fails', async () => {
      when(
        mockAppSync.listTransactionsByCardIdAndType(anything(), anything()),
      ).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedTransaction, id: '1' },
          { ...GraphQLDataFactory.sealedTransaction, id: '2' },
        ],
      })
      when(mockTransactionWorker.unsealTransaction(anything())).thenReject(
        new Error('failed to unseal 1'),
        new Error('failed to unseal 2'),
      )

      await expect(
        instanceUnderTest.listTransactionsByCardIdAndType({
          cardId: '',
          transactionType: TransactionType.Pending,
        }),
      ).resolves.toEqual({
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
        mockAppSync.listTransactionsByCardIdAndType(anything(), anything()),
      ).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedTransaction, id: '1' },
          { ...GraphQLDataFactory.sealedTransaction, id: '2' },
        ],
      })
      when(mockTransactionWorker.unsealTransaction(anything()))
        .thenReject(new Error('failed to unseal 1'))
        .thenResolve({ ...ServiceDataFactory.transactionUnsealed, id: '2' })

      await expect(
        instanceUnderTest.listTransactionsByCardIdAndType({
          cardId: '',
          transactionType: TransactionType.Pending,
        }),
      ).resolves.toEqual({
        status: ListOperationResultStatus.Partial,
        nextToken: undefined,
        items: [
          {
            ...EntityDataFactory.transaction,
            id: '2',
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

    it('succeeds when at least one instance of sealed transaction can be unsealed', async () => {
      when(
        mockAppSync.listTransactionsByCardIdAndType(anything(), anything()),
      ).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedTransaction, id: '1', keyId: 'key-1' },
          { ...GraphQLDataFactory.sealedTransaction, id: '1', keyId: 'key-2' },
        ],
      })
      when(mockTransactionWorker.unsealTransaction(anything()))
        .thenReject(new Error('failed to unseal key-1'))
        .thenResolve({
          ...ServiceDataFactory.transactionUnsealed,
          id: '1',
        })

      await expect(
        instanceUnderTest.listTransactionsByCardIdAndType({
          cardId: '',
          transactionType: TransactionType.Pending,
        }),
      ).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        nextToken: undefined,
        items: [
          {
            ...EntityDataFactory.transaction,
            id: '1',
          },
        ],
      })
    })

    it('returns only a single instance of a transaction sealed with multiple keys', async () => {
      when(
        mockAppSync.listTransactionsByCardIdAndType(anything(), anything()),
      ).thenResolve({
        items: [
          { ...GraphQLDataFactory.sealedTransaction, id: '1', keyId: 'key-1' },
          { ...GraphQLDataFactory.sealedTransaction, id: '1', keyId: 'key-2' },
        ],
      })
      when(mockTransactionWorker.unsealTransaction(anything())).thenResolve({
        ...ServiceDataFactory.transactionUnsealed,
        id: '1',
      })

      await expect(
        instanceUnderTest.listTransactionsByCardIdAndType({
          cardId: '',
          transactionType: TransactionType.Pending,
        }),
      ).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        nextToken: undefined,
        items: [
          {
            ...EntityDataFactory.transaction,
            id: '1',
          },
        ],
      })
    })
  })
})
