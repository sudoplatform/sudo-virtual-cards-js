import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import Stripe from 'stripe'
import { v4 } from 'uuid'
import { SudoVirtualCardsClient } from '../../../src'
import { createFundingSource } from '../util/createFundingSource'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient GetFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

  let instanceUnderTest: SudoVirtualCardsClient
  let stripe: Stripe

  describe('GetFundingSource', () => {
    beforeEach(async () => {
      const result = await setupVirtualCardsClient(log)
      instanceUnderTest = result.virtualCardsClient
      stripe = result.stripe
    })

    it('returns expected result', async () => {
      const fundingSource = await createFundingSource(instanceUnderTest, stripe)
      await expect(
        instanceUnderTest.getFundingSource({
          id: fundingSource.id,
          cachePolicy: CachePolicy.RemoteOnly,
        }),
      ).resolves.toStrictEqual(fundingSource)
    })

    it('returns undefined for non-existent funding source', async () => {
      await expect(
        instanceUnderTest.getFundingSource({
          id: v4(),
          cachePolicy: CachePolicy.RemoteOnly,
        }),
      ).resolves.toBeUndefined()
    })
  })
})
