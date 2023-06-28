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
import { SandboxSetFundingSourceToRequireRefreshInput } from '../../../../../../src'
import { FundingSourceService } from '../../../../../../src/private/domain/entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { SandboxSetFundingSourceToRequireRefreshUseCase } from '../../../../../../src/private/domain/use-cases/fundingSource/sandboxSetFundingSourceToRequireRefreshUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('SandboxSetFundingSourceToRequireRefreshUseCase Test Suite', () => {
  const mockFundingSourceService = mock<FundingSourceService>()
  const mockSudoUserService = mock<SudoUserService>()

  let iut: SandboxSetFundingSourceToRequireRefreshUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    reset(mockSudoUserService)

    iut = new SandboxSetFundingSourceToRequireRefreshUseCase(
      instance(mockFundingSourceService),
      instance(mockSudoUserService),
    )

    when(mockSudoUserService.isSignedIn()).thenResolve(true)
  })

  const input: SandboxSetFundingSourceToRequireRefreshInput = {
    fundingSourceId: 'funding-source-id',
  }

  const result = EntityDataFactory.bankAccountFundingSource

  it('throws NotSignedInError if user is not signed in', async () => {
    when(mockSudoUserService.isSignedIn()).thenResolve(false)

    await expect(iut.execute(input)).rejects.toThrow(NotSignedInError)

    verify(mockSudoUserService.isSignedIn()).once()
    verify(
      mockFundingSourceService.sandboxSetFundingSourceToRequireRefresh(
        anything(),
      ),
    ).never()
  })

  it('completes successfully', async () => {
    when(
      mockFundingSourceService.sandboxSetFundingSourceToRequireRefresh(
        anything(),
      ),
    ).thenResolve(result)

    await expect(iut.execute(input)).resolves.toEqual(result)

    verify(mockSudoUserService.isSignedIn()).once()
    verify(
      mockFundingSourceService.sandboxSetFundingSourceToRequireRefresh(
        anything(),
      ),
    ).once()
    const [actualInput] = capture(
      mockFundingSourceService.sandboxSetFundingSourceToRequireRefresh,
    ).first()
    expect(actualInput).toEqual(input)
  })
})
