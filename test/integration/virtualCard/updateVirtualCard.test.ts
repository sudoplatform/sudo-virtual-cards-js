import { DefaultLogger } from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import Stripe from 'stripe'
import { v4 } from 'uuid'
import {
  APIResultStatus,
  CardNotFoundError,
  SudoVirtualCardsClient,
  VirtualCard,
} from '../../../src'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('UpdateVirtualCard Test Suite', () => {
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

  describe('updateVirtualCard', () => {
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
      const result = await instanceUnderTest.updateVirtualCard({
        id: card.id,
        expectedCardVersion: card.version,
        cardHolder: 'newCardHolder',
        alias: 'newAlias',
        billingAddress: card.billingAddress,
      })
      expect(result).toBeDefined()
      expect(result.status).toBe(APIResultStatus.Success)
      expect(result.result).toMatchObject({
        id: card.id,
        cardHolder: 'newCardHolder',
        alias: 'newAlias',
        billingAddress: card.billingAddress,
      })
    })
    it('throws CardNotFoundError for non-existent id', async () => {
      await expect(
        instanceUnderTest.updateVirtualCard({
          id: v4(),
          cardHolder: 'newCardHolder',
          alias: 'newAlias',
          billingAddress: undefined,
        }),
      ).rejects.toThrow(CardNotFoundError)
    })
  })
})
