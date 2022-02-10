import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import {
  SimulatorMerchant,
  SudoVirtualCardsSimulatorClient,
} from '@sudoplatform/sudo-virtual-cards-simulator'
import Stripe from 'stripe'
import { v4 } from 'uuid'
import waitForExpect from 'wait-for-expect'
import {
  SudoVirtualCardsClient,
  Transaction,
  TransactionType,
  VirtualCard,
} from '../../../src'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('GetVirtualCard Test Suite', () => {
  jest.setTimeout(240000)
  waitForExpect.defaults.interval = 250
  waitForExpect.defaults.timeout = 5000

  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let profilesClient: SudoProfilesClient
  let vcSimulator: SudoVirtualCardsSimulatorClient
  let sudo: Sudo
  let stripe: Stripe
  let merchant: SimulatorMerchant
  let beforeEachComplete = false

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    vcSimulator = result.virtualCardsSimulatorClient
    sudo = result.sudo
    stripe = result.stripe

    const merchants = await vcSimulator.listSimulatorMerchants()

    const usdApprovingMerchant = merchants.find(
      (m) =>
        m.currency === 'USD' &&
        !m.declineAfterAuthorization &&
        !m.declineBeforeAuthorization,
    )
    if (!usdApprovingMerchant) {
      fail('Could not find a USD approving simulator merchant')
    }
    merchant = usdApprovingMerchant

    beforeEachComplete = true
  })

  function expectSetupComplete(): void {
    expect({ beforeEachComplete }).toEqual({ beforeEachComplete: true })
  }

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

    it('returns expected output with last transaction', async () => {
      expectSetupComplete()

      await expect(
        vcSimulator.simulateAuthorization({
          pan: card.pan,
          amount: 50,
          merchantId: merchant.id,
          expiry: card.expiry,
          billingAddress: card.billingAddress,
          csc: card.csc,
        }),
      ).resolves.toMatchObject({ approved: true })

      await waitForExpect(async () => {
        const gottenCard = await instanceUnderTest.getVirtualCard({
          id: card.id,
          cachePolicy: CachePolicy.RemoteOnly,
        })

        expect(gottenCard?.lastTransaction).toMatchObject<Partial<Transaction>>(
          {
            billedAmount: { currency: 'USD', amount: 50 },
            transactedAmount: { currency: 'USD', amount: 50 },
            description: merchant.name,
            type: TransactionType.Pending,
          },
        )
      })
    })

    it('returns expected output', async () => {
      expectSetupComplete()

      await expect(
        instanceUnderTest.getVirtualCard({
          id: card.id,
          cachePolicy: CachePolicy.RemoteOnly,
        }),
      ).resolves.toStrictEqual(card)
    })

    it('returns undefined for non-existent id', async () => {
      expectSetupComplete()

      await expect(
        instanceUnderTest.getVirtualCard({
          id: v4(),
          cachePolicy: CachePolicy.RemoteOnly,
        }),
      ).resolves.toBeUndefined()
    })
  })
})
