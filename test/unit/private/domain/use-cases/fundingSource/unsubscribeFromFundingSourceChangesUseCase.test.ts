import { anything, capture, instance, mock, reset, verify } from 'ts-mockito'
import { FundingSourceService } from '../../../../../../src/private/domain/entities/fundingSource/fundingSourceService'
import { UnsubscribeFromFundingSourceChangesUseCase } from '../../../../../../src/private/domain/use-cases/fundingSource/unsubscribeFromFundingSourceChangesUseCase'

describe('UnsubscribeFromFundingSourceChangesUseCase Test Suite', () => {
  const mockFundingSourceService = mock<FundingSourceService>()

  let instanceUnderTest: UnsubscribeFromFundingSourceChangesUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    instanceUnderTest = new UnsubscribeFromFundingSourceChangesUseCase(
      instance(mockFundingSourceService),
    )
  })

  describe('execute', () => {
    it('calls FundingSourceService unsubscribe from fundingSourceChanges', () => {
      instanceUnderTest.execute({
        id: 'subscribe-id',
      })
      verify(
        mockFundingSourceService.unsubscribeFromFundingSourceChanges(
          anything(),
        ),
      ).once()
      const [args] = capture(
        mockFundingSourceService.unsubscribeFromFundingSourceChanges,
      ).first()
      expect(args).toMatchObject({
        id: 'subscribe-id',
      })
    })
  })
})
