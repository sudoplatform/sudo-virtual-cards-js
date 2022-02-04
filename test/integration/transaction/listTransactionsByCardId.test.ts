import {
  DefaultLogger,
  ListOperationResultStatus,
} from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import { SudoVirtualCardsSimulatorClient } from '@sudoplatform/sudo-virtual-cards-simulator'
import Stripe from 'stripe'
import waitForExpect from 'wait-for-expect'
import { SudoVirtualCardsClient, VirtualCard } from '../../../src'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('ListTransactionsByCardId Test Suite', () => {
  jest.setTimeout(240000)
  waitForExpect.defaults.interval = 250
  waitForExpect.defaults.timeout = 5000

  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let vcSimulator: SudoVirtualCardsSimulatorClient
  let profilesClient: SudoProfilesClient
  let stripe: Stripe

  let sudo: Sudo
  let card: VirtualCard

  const setupTransactions = async (): Promise<void> => {
    const [approvedMerchant, deniedMerchant] = await vcSimulator
      .listSimulatorMerchants()
      .then((merchants) => {
        const approvedMerchant = merchants.find(
          (m) =>
            m.declineBeforeAuthorization === false &&
            m.declineAfterAuthorization === false,
        )
        const deniedMerchant = merchants.find(
          (m) => m.declineAfterAuthorization === true,
        )
        return [approvedMerchant, deniedMerchant]
      })
    if (!approvedMerchant || !deniedMerchant) {
      fail('expected merchants not found')
    }
    await Promise.all([
      vcSimulator.simulateAuthorization({
        pan: card.pan,
        amount: 50,
        merchantId: approvedMerchant.id,
        expiry: card.expiry,
        billingAddress: card.billingAddress,
        csc: card.csc,
      }),
      vcSimulator.simulateAuthorization({
        pan: card.pan,
        amount: 50,
        merchantId: deniedMerchant.id,
        expiry: card.expiry,
        billingAddress: card.billingAddress,
        csc: card.csc,
      }),
    ])
  }

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    sudo = result.sudo
    stripe = result.stripe
    vcSimulator = result.virtualCardsSimulatorClient

    card = await provisionVirtualCard(
      instanceUnderTest,
      profilesClient,
      sudo,
      stripe,
    )
    await setupTransactions()
  })

  describe('listTransactionsByCardId', () => {
    it('returns expected result', async () => {
      await waitForExpect(async () => {
        const result = await instanceUnderTest.listTransactionsByCardId({
          cardId: card.id,
        })
        if (result.status !== ListOperationResultStatus.Success) {
          fail('unexpected result')
        }
        expect(result.items).toHaveLength(2)
      })
    })

    it('limits transactions as expected', async () => {
      const result = await instanceUnderTest.listTransactionsByCardId({
        cardId: card.id,
        limit: 1,
      })
      if (result.status !== ListOperationResultStatus.Success) {
        fail('unexpected result')
      }
      expect(result.items).toHaveLength(1)
    })
    it('filters transactions as expected', async () => {
      const result = await instanceUnderTest.listTransactionsByCardId({
        cardId: card.id,
        filter: { cardId: { eq: card.id } },
      })
      if (result.status !== ListOperationResultStatus.Success) {
        fail('unexpected result')
      }
      expect(result.items).toHaveLength(2)
    })
  })
})
