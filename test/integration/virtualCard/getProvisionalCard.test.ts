import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import { v4 } from 'uuid'
import { SudoVirtualCardsClient, VirtualCard } from '../../../src'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('GetProvisionalCard Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let profilesClient: SudoProfilesClient
  let sudo: Sudo
  let fundingSourceProviders: FundingSourceProviders

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    sudo = result.sudo
    fundingSourceProviders = result.fundingSourceProviders
  })

  describe('getProvisionalCard', () => {
    let card: VirtualCard
    beforeEach(async () => {
      card = await provisionVirtualCard(
        instanceUnderTest,
        profilesClient,
        sudo,
        fundingSourceProviders,
      )
    })
    it('returns expected output', async () => {
      const result = await instanceUnderTest.getProvisionalCard({
        id: card.id,
        cachePolicy: CachePolicy.RemoteOnly,
      })
      expect(result).toBeDefined()
      if (result?.card) {
        expect(result.card).toStrictEqual(card)
      }
    })
    it('returns undefined for non-existent id', async () => {
      await expect(
        instanceUnderTest.getProvisionalCard({
          id: v4(),
          cachePolicy: CachePolicy.RemoteOnly,
        }),
      ).resolves.toBeUndefined()
    })
  })
})
