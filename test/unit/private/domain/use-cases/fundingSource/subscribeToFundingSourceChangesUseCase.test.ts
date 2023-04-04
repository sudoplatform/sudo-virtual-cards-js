import { NotSignedInError } from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import {
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito'
import { ConnectionState, FundingSource } from '../../../../../../src'
import { FundingSourceService } from '../../../../../../src/private/domain/entities/fundingSource/fundingSourceService'
import { SubscribeToFundingSourceChangesUseCase } from '../../../../../../src/private/domain/use-cases/fundingSource/subscribeToFundingSourceChangesUseCase'

describe('SubscribeToFundingSourceChangesUseCase Test Suite', () => {
  const mockFundingSourceService = mock<FundingSourceService>()
  const mockUserClient = mock<SudoUserClient>()

  let instanceUnderTest: SubscribeToFundingSourceChangesUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    reset(mockUserClient)
    instanceUnderTest = new SubscribeToFundingSourceChangesUseCase(
      instance(mockFundingSourceService),
      instance(mockUserClient),
    )
    when(mockUserClient.getSubject()).thenResolve('owner-id')
  })

  describe('execute', () => {
    it('throws NotSignedInError if user is not signed in', async () => {
      when(mockUserClient.getSubject()).thenResolve(undefined)
      await expect(
        instanceUnderTest.execute({
          id: 'subscription-id',
          subscriber: {
            fundingSourceChanged(fundingSource: FundingSource): Promise<void> {
              return Promise.resolve()
            },
          },
        }),
      ).rejects.toThrow(NotSignedInError)
    })

    it('calls FundingSourceService subscribe to fundingSourceChanges', async () => {
      await instanceUnderTest.execute({
        id: 'subscribe-id',
        subscriber: {
          fundingSourceChanged(fundingSource: FundingSource): Promise<void> {
            return Promise.resolve()
          },
          connectionStatusChanged(state: ConnectionState): void {
            return
          },
        },
      })
      verify(
        mockFundingSourceService.subscribeToFundingSourceChanges(anything()),
      ).once()
      const [args] = capture(
        mockFundingSourceService.subscribeToFundingSourceChanges,
      ).first()
      expect(args).toMatchObject({
        id: 'subscribe-id',
        owner: 'owner-id',
      })
      expect(args.subscriber).toBeDefined()
    })
  })
})
