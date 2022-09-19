import { DefaultLogger } from '@sudoplatform/sudo-common'
import { FundingSourceType, SudoVirtualCardsClient } from '../../../src'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient GetFundingSourceClientConfiguration Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

  let instanceUnderTest: SudoVirtualCardsClient

  describe('GetFundingSourceClientConfiguration', () => {
    beforeEach(async () => {
      const result = await setupVirtualCardsClient(log)
      instanceUnderTest = result.virtualCardsClient
    })

    it('returns expected result', async () => {
      const clientConfiguration =
        await instanceUnderTest.getFundingSourceClientConfiguration()
      expect(clientConfiguration.length).toBeGreaterThanOrEqual(1)

      // For now, Stripe is mandatory
      expect(clientConfiguration).toContainEqual({
        type: 'stripe',
        version: 1,
        fundingSourceType: FundingSourceType.CreditCard,
        apiKey: expect.stringMatching(/^pk_.*/),
      })
    })
  })
})
