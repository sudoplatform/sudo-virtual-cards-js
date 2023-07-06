/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CachePolicy,
  ListOperationResultStatus,
  NotSignedInError,
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
import { TransactionType } from '../../../../../../src'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { TransactionService } from '../../../../../../src/private/domain/entities/transaction/transactionService'
import { ListTransactionsByCardIdAndTypeUseCase } from '../../../../../../src/private/domain/use-cases/transaction/listTransactionsByCardIdAndTypeUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('ListTransactionsByCardIdAndTypeUseCase Test Suite', () => {
  let instanceUnderTest: ListTransactionsByCardIdAndTypeUseCase
  const mockTransactionService = mock<TransactionService>()
  const mockUserService = mock<SudoUserService>()

  beforeEach(() => {
    reset(mockTransactionService)
    reset(mockUserService)
    instanceUnderTest = new ListTransactionsByCardIdAndTypeUseCase(
      instance(mockTransactionService),
      instance(mockUserService),
    )
  })

  describe('execute', () => {
    beforeEach(() => {
      when(
        mockTransactionService.listTransactionsByCardIdAndType(anything()),
      ).thenResolve({
        status: ListOperationResultStatus.Success,
        items: [
          EntityDataFactory.transaction,
          EntityDataFactory.settledTransaction,
        ],
        nextToken: undefined,
      })
      when(mockUserService.isSignedIn()).thenResolve(true)
    })

    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(
        instanceUnderTest.execute({
          cardId: '',
          transactionType: TransactionType.Pending,
        }),
      ).rejects.toThrow(NotSignedInError)
    })

    it('completes successfully', async () => {
      const cardId = v4()
      const transactionType = TransactionType.Pending
      const cachePolicy = CachePolicy.CacheOnly
      const limit = 100
      const nextToken = v4()
      const result = await instanceUnderTest.execute({
        cardId,
        transactionType,
        cachePolicy,
        limit,
        nextToken,
      })
      verify(
        mockTransactionService.listTransactionsByCardIdAndType(anything()),
      ).once()
      const [args] = capture(
        mockTransactionService.listTransactionsByCardIdAndType,
      ).first()
      expect(args).toStrictEqual<typeof args>({
        cardId,
        transactionType,
        cachePolicy,
        limit,
        nextToken,
      })
      expect(result).toStrictEqual({
        items: [
          EntityDataFactory.transaction,
          EntityDataFactory.settledTransaction,
        ],
        nextToken: undefined,
        status: ListOperationResultStatus.Success,
      })
    })
    it('completes successfully with empty result', async () => {
      when(
        mockTransactionService.listTransactionsByCardIdAndType(anything()),
      ).thenResolve({ status: ListOperationResultStatus.Success, items: [] })
      await expect(
        instanceUnderTest.execute({
          cardId: '',
          transactionType: TransactionType.Pending,
        }),
      ).resolves.toStrictEqual({
        status: ListOperationResultStatus.Success,
        items: [],
      })
    })
  })
})
