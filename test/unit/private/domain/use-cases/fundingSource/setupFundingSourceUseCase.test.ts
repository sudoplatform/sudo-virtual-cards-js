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
import {
  FundingSourceType,
  SetupFundingSourceUseCase,
} from '../../../../../../src/private/domain/use-cases/fundingSource/setupFundingSourceUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('SetupFundingSourceUseCase Test Suite', () => {
  const mockFundingSourceService = mock<FundingSourceService>()
  const mockUserService = mock<SudoUserService>()

  let instanceUnderTest: SetupFundingSourceUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    reset(mockUserService)
    instanceUnderTest = new SetupFundingSourceUseCase(
      instance(mockFundingSourceService),
      instance(mockUserService),
    )
    when(mockFundingSourceService.setupFundingSource(anything())).thenResolve(
      EntityDataFactory.provisionalFundingSource,
    )
    when(mockUserService.isSignedIn()).thenResolve(true)
  })

  describe('execute', () => {
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserService.isSignedIn()).thenResolve(false)
      await expect(
        instanceUnderTest.execute({
          type: FundingSourceType.CreditCard,
          currency: 'dummyCurrency',
        }),
      ).rejects.toThrow(NotSignedInError)
    })

    it.each`
      type
      ${FundingSourceType.CreditCard}
      ${FundingSourceType.BankAccount}
    `(
      'calls FundingSourceService setupFundingSource for $type input',
      async ({ type }) => {
        await instanceUnderTest.execute({
          type,
          currency: 'dummyCurrency',
        })
        verify(mockFundingSourceService.setupFundingSource(anything())).once()
        const [args] = capture(
          mockFundingSourceService.setupFundingSource,
        ).first()
        expect(args).toEqual<typeof args>({
          type,
          currency: 'dummyCurrency',
        })
      },
    )

    it.each`
      type
      ${FundingSourceType.CreditCard}
      ${FundingSourceType.BankAccount}
    `(
      'returns FundingSourceService result for $type input',
      async ({ type }) => {
        when(
          mockFundingSourceService.setupFundingSource(anything()),
        ).thenResolve({ ...EntityDataFactory.provisionalFundingSource, type })
        await expect(
          instanceUnderTest.execute({
            type,
            currency: 'dummyCurrency',
          }),
        ).resolves.toEqual({
          ...EntityDataFactory.provisionalFundingSource,
          type,
        })
      },
    )
  })
})
