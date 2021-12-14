import { CachePolicy, NotSignedInError } from '@sudoplatform/sudo-common'
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
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { TransactionService } from '../../../../../../src/private/domain/entities/transaction/transactionService'
import { GetTransactionUseCase } from '../../../../../../src/private/domain/use-cases/transaction/getTransactionUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('GetTransactionUseCase Test Suite', () => {
  let instanceUnderTest: GetTransactionUseCase
  const mockTransactionService = mock<TransactionService>()
  const mockUserService = mock<SudoUserService>()

  beforeEach(() => {
    reset(mockTransactionService)
    reset(mockUserService)
    instanceUnderTest = new GetTransactionUseCase(
      instance(mockTransactionService),
      instance(mockUserService),
    )
  })

  describe('execute', () => {
    beforeEach(() => {
      when(mockTransactionService.getTransaction(anything())).thenResolve(
        EntityDataFactory.transaction,
      )
      when(mockUserService.isSignedIn()).thenResolve(true)
    })
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(
        instanceUnderTest.execute({
          id: '',
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).rejects.toThrow(NotSignedInError)
    })
    it('completes successfully', async () => {
      const id = v4()
      const result = await instanceUnderTest.execute({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockTransactionService.getTransaction(anything())).once()
      const [args] = capture(mockTransactionService.getTransaction).first()
      expect(args).toStrictEqual<typeof args>({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(result).toStrictEqual(EntityDataFactory.transaction)
    })
  })
})
