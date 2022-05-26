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
import { ListProvisionalCardsUseCase } from '../../../../../../src/private/domain/use-cases/virtualCard/listProvisionalCardsUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('ListProvisionalCardsUseCase Test Suite', () => {
  let instanceUnderTest: ListProvisionalCardsUseCase
  const mockVirtualCardService = mock<VirtualCardService>()
  const mockUserService = mock<SudoUserService>()

  beforeEach(() => {
    reset(mockVirtualCardService)
    reset(mockUserService)
    instanceUnderTest = new ListProvisionalCardsUseCase(
      instance(mockVirtualCardService),
      instance(mockUserService),
    )
  })

  describe('execute', () => {
    const nextToken = v4()
    beforeEach(() => {
      when(mockVirtualCardService.listProvisionalCards(anything())).thenResolve(
        {
          status: ListOperationResultStatus.Success,
          items: [EntityDataFactory.provisionalVirtualCard],
          nextToken,
        },
      )
      when(mockUserService.isSignedIn()).thenResolve(true)
    })
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(instanceUnderTest.execute()).rejects.toThrow(
        NotSignedInError,
      )
    })
    it('completes successfully', async () => {
      const limit = 5
      const inputNextToken = v4()
      const result = await instanceUnderTest.execute({
        cachePolicy: CachePolicy.CacheOnly,
        limit,
        nextToken: inputNextToken,
      })
      verify(mockVirtualCardService.listProvisionalCards(anything())).once()
      const [args] = capture(
        mockVirtualCardService.listProvisionalCards,
      ).first()
      expect(args).toStrictEqual<typeof args>({
        cachePolicy: CachePolicy.CacheOnly,
        limit,
        nextToken: inputNextToken,
      })
      expect(result).toStrictEqual<typeof result>({
        status: ListOperationResultStatus.Success,
        items: [EntityDataFactory.provisionalVirtualCard],
        nextToken,
      })
    })

    it('completes successfully with empty result', async () => {
      when(mockVirtualCardService.listProvisionalCards(anything())).thenResolve(
        {
          status: ListOperationResultStatus.Success,
          items: [],
        },
      )
      await expect(instanceUnderTest.execute()).resolves.toStrictEqual({
        status: ListOperationResultStatus.Success,
        items: [],
      })
    })
  })
})
