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
import { FundingSourceService } from '../../../../../../src/private/domain/entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { GetFundingSourceUseCase } from '../../../../../../src/private/domain/use-cases/fundingSource/getFundingSourceUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('GetFundingSourceUseCase', () => {
  const mockFundingSourceService = mock<FundingSourceService>()
  const mockUserService = mock<SudoUserService>()

  let instanceUnderTest: GetFundingSourceUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    reset(mockUserService)
    instanceUnderTest = new GetFundingSourceUseCase(
      instance(mockFundingSourceService),
      instance(mockUserService),
    )
    when(mockUserService.isSignedIn()).thenResolve(true)
  })

  describe('execute', () => {
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
      when(mockFundingSourceService.getFundingSource(anything())).thenResolve(
        EntityDataFactory.defaultFundingSource,
      )
      const result = await instanceUnderTest.execute({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockFundingSourceService.getFundingSource(anything())).once()
      const [inputArgs] = capture(
        mockFundingSourceService.getFundingSource,
      ).first()
      expect(inputArgs).toStrictEqual<typeof inputArgs>({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(result).toStrictEqual(EntityDataFactory.defaultFundingSource)
    })

    it('completes successfully with undefined result', async () => {
      const id = v4()
      when(mockFundingSourceService.getFundingSource(anything())).thenResolve(
        undefined,
      )
      const result = await instanceUnderTest.execute({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockFundingSourceService.getFundingSource(anything())).once()
      const [inputArgs] = capture(
        mockFundingSourceService.getFundingSource,
      ).first()
      expect(inputArgs).toStrictEqual<typeof inputArgs>({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(result).toStrictEqual(undefined)
    })
  })
})
