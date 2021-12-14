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
import { VirtualCardService } from '../../../../../../src/private/domain/entities/virtualCard/virtualCardService'
import { GetProvisionalCardUseCase } from '../../../../../../src/private/domain/use-cases/virtualCard/getProvisionalCardUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('GetProvisionalCardUseCase Test Suite', () => {
  let instanceUnderTest: GetProvisionalCardUseCase
  const mockVirtualCardService = mock<VirtualCardService>()
  const mockUserService = mock<SudoUserService>()

  beforeEach(() => {
    reset(mockVirtualCardService)
    reset(mockUserService)
    instanceUnderTest = new GetProvisionalCardUseCase(
      instance(mockVirtualCardService),
      instance(mockUserService),
    )
  })

  describe('execute', () => {
    beforeEach(() => {
      when(mockVirtualCardService.getProvisionalCard(anything())).thenResolve(
        EntityDataFactory.provisionalVirtualCard,
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
      verify(mockVirtualCardService.getProvisionalCard(anything())).once()
      const [args] = capture(mockVirtualCardService.getProvisionalCard).first()
      expect(args).toStrictEqual<typeof args>({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(result).toStrictEqual(EntityDataFactory.provisionalVirtualCard)
    })

    it('completes successfully with undefined result', async () => {
      when(mockVirtualCardService.getProvisionalCard(anything())).thenResolve(
        undefined,
      )
      await expect(
        instanceUnderTest.execute({
          id: '',
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).resolves.toBeUndefined()
    })
  })
})
