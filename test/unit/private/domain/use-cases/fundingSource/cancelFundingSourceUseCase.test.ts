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
import { FundingSourceService } from '../../../../../../src/private/domain/entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { CancelFundingSourceUseCase } from '../../../../../../src/private/domain/use-cases/fundingSource/cancelFundingSourceUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('CancelFundingSourceUseCase Test Suite', () => {
  const mockFundingSourceService = mock<FundingSourceService>()
  const mockUserService = mock<SudoUserService>()

  let instanceUnderTest: CancelFundingSourceUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    reset(mockUserService)
    instanceUnderTest = new CancelFundingSourceUseCase(
      instance(mockFundingSourceService),
      instance(mockUserService),
    )
    when(mockUserService.isSignedIn()).thenResolve(true)
  })

  describe('execute', () => {
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(instanceUnderTest.execute('')).rejects.toThrow(
        NotSignedInError,
      )
    })
    it('completes successfully with valid input', async () => {
      when(
        mockFundingSourceService.cancelFundingSource(anything()),
      ).thenResolve(EntityDataFactory.fundingSource)
      const result = await instanceUnderTest.execute(
        EntityDataFactory.fundingSource.id,
      )
      expect(result).toStrictEqual(EntityDataFactory.fundingSource)
      const [inputArgs] = capture(
        mockFundingSourceService.cancelFundingSource,
      ).first()
      expect(inputArgs).toStrictEqual<typeof inputArgs>({
        id: EntityDataFactory.fundingSource.id,
      })
      verify(mockFundingSourceService.cancelFundingSource(anything())).once()
    })
  })
})
