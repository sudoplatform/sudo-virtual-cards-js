import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import { v4 } from 'uuid'
import { SudoVirtualCardsClient } from '../../../src'
import {
  CardProviderName,
  createCardFundingSource,
} from '../util/createFundingSource'
import { ProviderAPIs } from '../util/getProviderAPIs'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient GetFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

  let instanceUnderTest: SudoVirtualCardsClient
  let apis: ProviderAPIs

  describe('GetFundingSource', () => {
    beforeAll(async () => {
      const result = await setupVirtualCardsClient(log)
      instanceUnderTest = result.virtualCardsClient
      apis = result.apis
    })

    describe.each`
      provider
      ${'stripe'}
      ${'checkout'}
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

        it('returns expected result', async () => {
          if (skip) return

          const fundingSource = await createCardFundingSource(
            instanceUnderTest,
            apis,
            { supportedProviders: [provider] },
          )
          await expect(
            instanceUnderTest.getFundingSource({
              id: fundingSource.id,
              cachePolicy: CachePolicy.RemoteOnly,
            }),
          ).resolves.toStrictEqual(fundingSource)
        })

        it('returns undefined for non-existent funding source', async () => {
          if (skip) return

          await expect(
            instanceUnderTest.getFundingSource({
              id: v4(),
              cachePolicy: CachePolicy.RemoteOnly,
            }),
          ).resolves.toBeUndefined()
        })
      },
    )
  })
})
