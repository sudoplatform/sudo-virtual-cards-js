import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import Stripe from 'stripe'
import { v4 } from 'uuid'
import { SudoVirtualCardsClient, VirtualCard } from '../../../src'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('GetVirtualCard Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let profilesClient: SudoProfilesClient
  let sudo: Sudo
  let stripe: Stripe

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    sudo = result.sudo
    stripe = result.stripe
  })

  describe('getVirtualCard', () => {
    let card: VirtualCard
    beforeEach(async () => {
      card = await provisionVirtualCard(
        instanceUnderTest,
        profilesClient,
        sudo,
        stripe,
      )
    })
    it('returns expected output', async () => {
      await expect(
        instanceUnderTest.getVirtualCard({
          id: card.id,
          cachePolicy: CachePolicy.RemoteOnly,
        }),
      ).resolves.toStrictEqual(card)
    })
    it('returns undefined for non-existent id', async () => {
      await expect(
        instanceUnderTest.getVirtualCard({
          id: v4(),
          cachePolicy: CachePolicy.RemoteOnly,
        }),
      ).resolves.toBeUndefined()
    })
  })
})
