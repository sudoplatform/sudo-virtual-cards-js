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
import { ListTransactionsByCardIdUseCase } from '../../../../../../src/private/domain/use-cases/transaction/listTransactionsByCardIdUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('ListTransactionsByCardIdUseCase Test Suite', () => {
  let instanceUnderTest: ListTransactionsByCardIdUseCase
  const mockTransactionService = mock<TransactionService>()
  const mockUserService = mock<SudoUserService>()

  beforeEach(() => {
    reset(mockTransactionService)
    reset(mockUserService)
    instanceUnderTest = new ListTransactionsByCardIdUseCase(
      instance(mockTransactionService),
      instance(mockUserService),
    )
  })

  describe('execute', () => {
    beforeEach(() => {
      when(
        mockTransactionService.listTransactionsByCardId(anything()),
      ).thenResolve({
        status: ListOperationResultStatus.Success,
        items: [EntityDataFactory.transaction],
        nextToken: undefined,
      })
      when(mockUserService.isSignedIn()).thenResolve(true)
    })
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(
        instanceUnderTest.execute({
          cardId: '',
        }),
      ).rejects.toThrow(NotSignedInError)
    })
    it('completes successfully', async () => {
      const cardId = v4()
      const cachePolicy = CachePolicy.CacheOnly
      const filter = { id: { eq: v4() } }
      const limit = 100
      const nextToken = v4()
      const dateRange = { startDate: new Date(), endDate: new Date() }
      const sortOrder = SortOrder.Asc
      const result = await instanceUnderTest.execute({
        cardId,
        cachePolicy,
        filter,
        limit,
        nextToken,
        dateRange,
        sortOrder,
      })
      verify(mockTransactionService.listTransactionsByCardId(anything())).once()
      const [args] = capture(
        mockTransactionService.listTransactionsByCardId,
      ).first()
      expect(args).toStrictEqual<typeof args>({
        cardId,
        cachePolicy,
        filter,
        limit,
        nextToken,
        dateRange,
        sortOrder,
      })
      expect(result).toStrictEqual({
        items: [EntityDataFactory.transaction],
        nextToken: undefined,
        status: ListOperationResultStatus.Success,
      })
    })
    it('completes successfully with empty result', async () => {
      when(
        mockTransactionService.listTransactionsByCardId(anything()),
      ).thenResolve({ status: ListOperationResultStatus.Success, items: [] })
      await expect(
        instanceUnderTest.execute({ cardId: '' }),
      ).resolves.toStrictEqual({
        status: ListOperationResultStatus.Success,
        items: [],
      })
    })
  })
})
