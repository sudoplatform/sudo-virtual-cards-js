import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import { FundingSource, SudoVirtualCardsClient } from '../../../src'
import {
  CardProviderName,
  createCardFundingSource,
} from '../util/createFundingSource'
import { ProviderAPIs } from '../util/getProviderAPIs'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient ListFundingSources Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

  let fundingSources: FundingSource[] = []
  let instanceUnderTest: SudoVirtualCardsClient
  let apis: ProviderAPIs

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    apis = result.apis
  })

  afterEach(() => {
    fundingSources = []
  })

  describe('listFundingSources', () => {
    describe.each`
      provider
      ${'stripe'}
    `(
      'for provider $provider',
      ({ provider }: { provider: CardProviderName }) => {
        let skip = false
        beforeEach(() => {
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

          const visaFundingSource = await createCardFundingSource(
            instanceUnderTest,
            apis,
            {
              testCard: 'Visa-No3DS-1',
              supportedProviders: [provider],
            },
          )
          const mastercardFundingSource = await createCardFundingSource(
            instanceUnderTest,
            apis,
            {
              testCard: 'MC-No3DS-1',
              supportedProviders: [provider],
            },
          )
          fundingSources.push(visaFundingSource)
          fundingSources.push(mastercardFundingSource)
          const result = await instanceUnderTest.listFundingSources({
            cachePolicy: CachePolicy.RemoteOnly,
          })
          expect(result.items).toHaveLength(fundingSources.length)
          expect(result.items).toStrictEqual(
            expect.arrayContaining(fundingSources),
          )
        })

        it('returns empty list result for no matching funding sources', async () => {
          const result = await instanceUnderTest.listFundingSources({
            cachePolicy: CachePolicy.RemoteOnly,
          })
          expect(result.items).toEqual([])
        })

        it('returns expected result when limit specified', async () => {
          await createCardFundingSource(instanceUnderTest, apis, {
            testCard: 'Visa-No3DS-1',
            supportedProviders: [provider],
          })
          await createCardFundingSource(instanceUnderTest, apis, {
            testCard: 'MC-No3DS-1',
            supportedProviders: [provider],
          })

          const result = await instanceUnderTest.listFundingSources({
            cachePolicy: CachePolicy.RemoteOnly,
            limit: 1,
          })
          expect(result.items).toHaveLength(1)
          expect(result.nextToken).toBeTruthy()
        })
      },
    )
  })
})
