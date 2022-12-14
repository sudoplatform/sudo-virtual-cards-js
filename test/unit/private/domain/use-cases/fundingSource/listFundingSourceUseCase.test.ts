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
import { FundingSourceService } from '../../../../../../src/private/domain/entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { ListFundingSourcesUseCase } from '../../../../../../src/private/domain/use-cases/fundingSource/listFundingSourcesUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('ListFundingSourcesUseCase Test Suite', () => {
  const mockFundingSourceService = mock<FundingSourceService>()
  const mockUserService = mock<SudoUserService>()

  let instanceUnderTest: ListFundingSourcesUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    reset(mockUserService)
    instanceUnderTest = new ListFundingSourcesUseCase(
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
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).rejects.toThrow(NotSignedInError)
    })
    it('completes successfully', async () => {
      when(mockFundingSourceService.listFundingSources(anything())).thenResolve(
        {
          fundingSources: [EntityDataFactory.defaultFundingSource],
        },
      )
      const result = await instanceUnderTest.execute({
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockFundingSourceService.listFundingSources(anything())).once()
      const [inputArgs] = capture(
        mockFundingSourceService.listFundingSources,
      ).first()
      expect(inputArgs).toStrictEqual<typeof inputArgs>({
        cachePolicy: CachePolicy.CacheOnly,
        limit: undefined,
        nextToken: undefined,
      })
      expect(result).toStrictEqual({
        fundingSources: [EntityDataFactory.defaultFundingSource],
      })
    })

    it('completes successfully with empty result items', async () => {
      when(mockFundingSourceService.listFundingSources(anything())).thenResolve(
        {
          fundingSources: [EntityDataFactory.defaultFundingSource],
        },
      )
      const result = await instanceUnderTest.execute({
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockFundingSourceService.listFundingSources(anything())).once()
      const [inputArgs] = capture(
        mockFundingSourceService.listFundingSources,
      ).first()
      expect(inputArgs).toStrictEqual<typeof inputArgs>({
        cachePolicy: CachePolicy.CacheOnly,
        limit: undefined,
        nextToken: undefined,
      })
      expect(result).toStrictEqual({
        fundingSources: [EntityDataFactory.defaultFundingSource],
      })
    })
  })
})
