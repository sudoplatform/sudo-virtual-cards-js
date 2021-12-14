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
import { CompleteFundingSourceUseCase } from '../../../../../../src/private/domain/use-cases/fundingSource/completeFundingSourceUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('CompleteFundingSourceUseCase Test Suite', () => {
  const mockFundingSourceService = mock<FundingSourceService>()
  const mockUserService = mock<SudoUserService>()

  let instanceUnderTest: CompleteFundingSourceUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    reset(mockUserService)
    instanceUnderTest = new CompleteFundingSourceUseCase(
      instance(mockFundingSourceService),
      instance(mockUserService),
    )
    when(
      mockFundingSourceService.completeFundingSource(anything()),
    ).thenResolve(EntityDataFactory.fundingSource)
    when(mockUserService.isSignedIn()).thenResolve(true)
  })

  describe('execute', () => {
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(
        instanceUnderTest.execute({
          id: 'dummyId',
          completionData: { provider: '', version: 1, paymentMethod: '' },
        }),
      ).rejects.toThrow(NotSignedInError)
    })

    it('calls FundingSourceService completeFundingSource', async () => {
      await instanceUnderTest.execute({
        id: 'dummyId',
        completionData: { provider: '', version: 1, paymentMethod: '' },
      })
      verify(mockFundingSourceService.completeFundingSource(anything())).once()
      const [args] = capture(
        mockFundingSourceService.completeFundingSource,
      ).first()
      expect(args).toStrictEqual<typeof args>({
        id: 'dummyId',
        completionData: { provider: '', version: 1, paymentMethod: '' },
      })
    })

    it('returns FundingSourceService result', async () => {
      when(
        mockFundingSourceService.completeFundingSource(anything()),
      ).thenResolve(EntityDataFactory.fundingSource)
      await expect(
        instanceUnderTest.execute({
          id: 'dummyId',
          completionData: { provider: '', version: 1, paymentMethod: '' },
        }),
      ).resolves.toStrictEqual(EntityDataFactory.fundingSource)
    })
  })
})
