import { DefaultLogger } from '@sudoplatform/sudo-common'
import { SudoVirtualCardsClient } from '../../../src'
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
      expect(clientConfiguration).toHaveLength(1)
      expect(clientConfiguration[0].type).toStrictEqual('stripe')
      expect(clientConfiguration[0].version).toStrictEqual(1)
    })
  })
})
