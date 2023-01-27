import { DefaultLogger } from '@sudoplatform/sudo-common'
import {
  FundingSourceNotFoundError,
  FundingSourceState,
  FundingSourceType,
  SudoVirtualCardsClient,
} from '../../../src'
import { createCardFundingSource } from '../util/createFundingSource'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient CancelFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let fundingSourceProviders: FundingSourceProviders

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    fundingSourceProviders = result.fundingSourceProviders
  })

  describe('CancelFundingSource', () => {
    describe.each`
      provider      | type                            | providerEnabled
      ${'stripe'}   | ${FundingSourceType.CreditCard} | ${'stripeCardEnabled'}
      ${'checkout'} | ${FundingSourceType.CreditCard} | ${'checkoutCardEnabled'}
    `(
      'for $type provider $provider',
      ({
        provider,
        type,
        providerEnabled,
      }: {
        provider: keyof FundingSourceProviders['apis']
        type: FundingSourceType
        providerEnabled: keyof Omit<FundingSourceProviders, 'apis'>
      }) => {
        let skip = false
        beforeAll(() => {
          // Since we determine availability of provider
          // asynchronously we can't use that knowledge
          // to control the set of providers we iterate
          // over so we have to use a flag
          if (!fundingSourceProviders[providerEnabled]) {
            console.warn(
              `${type} provider ${provider} not enabled. Skipping tests.`,
            )
            skip = true
          }
        })

        it('returns expected inactive funding source output', async () => {
          if (skip) return

          const fundingSource = await createCardFundingSource(
            instanceUnderTest,
            fundingSourceProviders,
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
