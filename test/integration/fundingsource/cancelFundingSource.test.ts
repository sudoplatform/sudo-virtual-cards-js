import { DefaultLogger } from '@sudoplatform/sudo-common'
import {
  FundingSourceNotFoundError,
  FundingSourceState,
  SudoVirtualCardsClient,
} from '../../../src'
import {
  CardProviderName,
  createCardFundingSource,
} from '../util/createFundingSource'
import { ProviderAPIs } from '../util/getProviderAPIs'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient CancelFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let apis: ProviderAPIs

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    apis = result.apis
  })

  describe('CancelFundingSource', () => {
    describe.each`
      provider
      ${'stripe'}
    `(
      'for provider $provider',
      ({ provider }: { provider: CardProviderName }) => {
        let skip = false
        beforeAll(() => {
          // Since we determine availability of provider
          // asynchronously we can't use that knowledge
          // to control the set of providers we iterate
          // over so we have to use a flag
          if (!apis[provider]) {
            console.warn(
              `No API available for provider ${provider}. Skipping tests.`,
            )
            skip = true
          }
        })

        it('returns expected inactive funding source output', async () => {
          if (skip) return

          const fundingSource = await createCardFundingSource(
            instanceUnderTest,
            apis,
            {
              supportedProviders: [provider],
            },
          )
          expect(fundingSource.state).toEqual(FundingSourceState.Active)

          const result = await instanceUnderTest.cancelFundingSource(
            fundingSource.id,
          )
          expect(result.id).toEqual(fundingSource.id)
          expect(result.state).toEqual(FundingSourceState.Inactive)
        })

        it('throws a FundingSourceNotFound error when non-existent funding source is attempted to be cancelled', async () => {
          await expect(
            instanceUnderTest.cancelFundingSource('non-existent-id'),
          ).rejects.toThrow(FundingSourceNotFoundError)
        })
      },
    )
  })
})
