import { NotSignedInError } from '@sudoplatform/sudo-common'
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
import { APIResultStatus } from '../../../../../../src'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { VirtualCardService } from '../../../../../../src/private/domain/entities/virtualCard/virtualCardService'
import { CancelVirtualCardUseCase } from '../../../../../../src/private/domain/use-cases/virtualCard/cancelVirtualCardUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('CancelVirtualCardUseCase', () => {
  let instanceUnderTest: CancelVirtualCardUseCase
  const mockVirtualCardService = mock<VirtualCardService>()
  const mockUserService = mock<SudoUserService>()

  beforeEach(() => {
    reset(mockVirtualCardService)
    instanceUnderTest = new CancelVirtualCardUseCase(
      instance(mockVirtualCardService),
      instance(mockUserService),
    )
    when(mockUserService.isSignedIn()).thenResolve(true)
    when(mockVirtualCardService.cancelVirtualCard(anything())).thenResolve({
      status: APIResultStatus.Success,
      result: EntityDataFactory.virtualCard,
    })
  })

  describe('execute', () => {
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(
        instanceUnderTest.execute({
          id: '',
        }),
      ).rejects.toThrow(NotSignedInError)
    })
    it('calls virtual cards service provision', async () => {
      const id = v4()
      await instanceUnderTest.execute({
        id,
      })
      verify(mockVirtualCardService.cancelVirtualCard(anything())).once()
      const [args] = capture(mockVirtualCardService.cancelVirtualCard).first()
      expect(args).toStrictEqual<typeof args>({
        id,
      })
    })
    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.execute({ id: '' }),
      ).resolves.toStrictEqual({
        status: APIResultStatus.Success,
        result: EntityDataFactory.virtualCard,
      })
    })
  })
})
