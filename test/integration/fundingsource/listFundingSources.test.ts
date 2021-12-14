import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import Stripe from 'stripe'
import { FundingSource, SudoVirtualCardsClient } from '../../../src'
import {
  createFundingSource,
  Mastercard,
  Visa,
} from '../util/createFundingSource'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient ListFundingSources Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

  let fundingSources: FundingSource[] = []
  let instanceUnderTest: SudoVirtualCardsClient
  let stripe: Stripe

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    stripe = result.stripe
  })

  afterEach(() => {
    fundingSources = []
  })

  describe('listFundingSources', () => {
    it('returns expected result', async () => {
      const visaFundingSource = await createFundingSource(
        instanceUnderTest,
        stripe,
        {
          creditCardNumber: Visa.creditCardNumber,
        },
      )
      const mastercardFundingSource = await createFundingSource(
        instanceUnderTest,
        stripe,
        { creditCardNumber: Mastercard.creditCardNumber },
      )
      fundingSources.push(visaFundingSource)
      fundingSources.push(mastercardFundingSource)
      const result = await instanceUnderTest.listFundingSources({
        cachePolicy: CachePolicy.RemoteOnly,
      })
      expect(result.items).toHaveLength(fundingSources.length)
      expect(result.items).toStrictEqual(expect.arrayContaining(fundingSources))
    })

    it('returns empty list result for no matching funding sources', async () => {
      const result = await instanceUnderTest.listFundingSources({
        cachePolicy: CachePolicy.RemoteOnly,
      })
      expect(result.items).toEqual([])
    })
  })
})
