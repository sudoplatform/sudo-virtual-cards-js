import { DefaultLogger } from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import {
  FundingSourceType,
  ProvisionalFundingSourceState,
  StateReason,
  SudoVirtualCardsClient,
} from '../../../src'
import { uuidV4Regex } from '../../utility/uuidV4Regex'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient SetupFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let userClient: SudoUserClient

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    userClient = result.userClient
  })

  describe('SetupFundingSource', () => {
    it('returns expected output', async () => {
      const result = await instanceUnderTest.setupFundingSource({
        currency: 'USD',
        type: FundingSourceType.CreditCard,
      })
      expect(result).toMatchObject({
        id: expect.stringMatching(uuidV4Regex('vc-fnd')),
        owner: await userClient.getSubject(),
        version: 1,
        state: ProvisionalFundingSourceState.Provisioning,
        stateReason: StateReason.Processing,
      })
      expect(result.provisioningData).toMatchObject({
        version: 1,
        provider: 'stripe',
      })
    })
    it('throws an error', async () => {
      await expect(
        instanceUnderTest.setupFundingSource({
          currency: 'AAAAAAAAAA',
          type: FundingSourceType.CreditCard,
        }),
      ).rejects.toThrow()
    })
  })
})
