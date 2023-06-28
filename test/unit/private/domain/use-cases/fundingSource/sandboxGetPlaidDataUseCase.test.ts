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
import {
  BankAccountType,
  SandboxGetPlaidDataInput,
} from '../../../../../../src'
import { FundingSourceService } from '../../../../../../src/private/domain/entities/fundingSource/fundingSourceService'
import { SandboxPlaidDataEntity } from '../../../../../../src/private/domain/entities/fundingSource/sandboxPlaidDataEntity'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { SandboxGetPlaidDataUseCase } from '../../../../../../src/private/domain/use-cases/fundingSource/sandboxGetPlaidDataUseCase'

describe('SandboxGetPlaidDataUseCase Test Suite', () => {
  const mockFundingSourceService = mock<FundingSourceService>()
  const mockSudoUserService = mock<SudoUserService>()

  let iut: SandboxGetPlaidDataUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    reset(mockSudoUserService)

    iut = new SandboxGetPlaidDataUseCase(
      instance(mockFundingSourceService),
      instance(mockSudoUserService),
    )

    when(mockSudoUserService.isSignedIn()).thenResolve(true)
  })

  const input: SandboxGetPlaidDataInput = {
    institutionId: 'institution-id',
    plaidUsername: 'plaid-username',
  }

  const result: SandboxPlaidDataEntity = {
    accountMetadata: [
      { accountId: 'account-id', subtype: BankAccountType.Checking },
    ],
    publicToken: 'public-token',
  }

  it('throws NotSignedInError if user is not signed in', async () => {
    when(mockSudoUserService.isSignedIn()).thenResolve(false)

    await expect(iut.execute(input)).rejects.toThrow(NotSignedInError)

    verify(mockSudoUserService.isSignedIn()).once()
    verify(mockFundingSourceService.sandboxGetPlaidData(anything())).never()
  })

  it('completes successfully', async () => {
    when(mockFundingSourceService.sandboxGetPlaidData(anything())).thenResolve(
      result,
    )

    await expect(iut.execute(input)).resolves.toEqual(result)

    verify(mockSudoUserService.isSignedIn()).once()
    verify(mockFundingSourceService.sandboxGetPlaidData(anything())).once()
    const [actualInput] = capture(
      mockFundingSourceService.sandboxGetPlaidData,
    ).first()
    expect(actualInput).toEqual(input)
  })
})
