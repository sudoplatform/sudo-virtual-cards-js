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
import { SortOrder } from '../../../../../../src'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { TransactionService } from '../../../../../../src/private/domain/entities/transaction/transactionService'
import { ListTransactionsUseCase } from '../../../../../../src/private/domain/use-cases/transaction/listTransactionsUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('ListTransactionsUseCase Test Suite', () => {
  let instanceUnderTest: ListTransactionsUseCase
  const mockTransactionService = mock<TransactionService>()
  const mockUserService = mock<SudoUserService>()

  beforeEach(() => {
    reset(mockTransactionService)
    reset(mockUserService)
    instanceUnderTest = new ListTransactionsUseCase(
      instance(mockTransactionService),
      instance(mockUserService),
    )
  })

  describe('execute', () => {
    beforeEach(() => {
      when(mockTransactionService.listTransactions(anything())).thenResolve({
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
      await expect(instanceUnderTest.execute({})).rejects.toThrow(
        NotSignedInError,
      )
    })

    it('completes successfully', async () => {
      const cachePolicy = CachePolicy.CacheOnly
      const limit = 100
      const nextToken = v4()
      const dateRange = { startDate: new Date(), endDate: new Date() }
      const sortOrder = SortOrder.Asc
      const result = await instanceUnderTest.execute({
        cachePolicy,
        limit,
        nextToken,
        dateRange,
        sortOrder,
      })
      verify(mockTransactionService.listTransactions(anything())).once()
      const [args] = capture(mockTransactionService.listTransactions).first()
      expect(args).toStrictEqual<typeof args>({
        cachePolicy,
        limit,
        nextToken,
        dateRange,
        sortOrder,
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
      when(mockTransactionService.listTransactions(anything())).thenResolve({
        status: ListOperationResultStatus.Success,
        items: [],
      })
      await expect(instanceUnderTest.execute({})).resolves.toStrictEqual({
        status: ListOperationResultStatus.Success,
        items: [],
      })
    })
  })
})
