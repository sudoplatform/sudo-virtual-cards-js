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
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { VirtualCardService } from '../../../../../../src/private/domain/entities/virtualCard/virtualCardService'
import { ListVirtualCardsUseCase } from '../../../../../../src/private/domain/use-cases/virtualCard/listVirtualCardsUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('ListVirtualCardsUseCase Test Suite', () => {
  let instanceUnderTest: ListVirtualCardsUseCase
  const mockVirtualCardService = mock<VirtualCardService>()
  const mockUserService = mock<SudoUserService>()

  beforeEach(() => {
    reset(mockVirtualCardService)
    reset(mockUserService)
    instanceUnderTest = new ListVirtualCardsUseCase(
      instance(mockVirtualCardService),
      instance(mockUserService),
    )
  })

  describe('execute', () => {
    const nextToken = v4()
    beforeEach(() => {
      when(mockVirtualCardService.listVirtualCards(anything())).thenResolve({
        status: ListOperationResultStatus.Success,
        items: [EntityDataFactory.virtualCard],
        nextToken,
      })
      when(mockUserService.isSignedIn()).thenResolve(true)
    })
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(instanceUnderTest.execute()).rejects.toThrow(
        NotSignedInError,
      )
    })
    it('completes successfully', async () => {
      const filter = { id: { eq: v4() } }
      const limit = 5
      const inputNextToken = v4()
      const result = await instanceUnderTest.execute({
        filter,
        cachePolicy: CachePolicy.CacheOnly,
        limit,
        nextToken: inputNextToken,
      })
      verify(mockVirtualCardService.listVirtualCards(anything())).once()
      const [args] = capture(mockVirtualCardService.listVirtualCards).first()
      expect(args).toStrictEqual<typeof args>({
        filter,
        cachePolicy: CachePolicy.CacheOnly,
        limit,
        nextToken: inputNextToken,
      })
      expect(result).toStrictEqual<typeof result>({
        status: ListOperationResultStatus.Success,
        items: [EntityDataFactory.virtualCard],
        nextToken,
      })
    })

    it('completes successfully with empty result', async () => {
      when(mockVirtualCardService.listVirtualCards(anything())).thenResolve({
        status: ListOperationResultStatus.Success,
        items: [],
      })
      await expect(instanceUnderTest.execute()).resolves.toStrictEqual({
        status: ListOperationResultStatus.Success,
        items: [],
      })
    })
  })
})
