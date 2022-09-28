import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import {
  SimulatorMerchant,
  SudoVirtualCardsSimulatorClient,
} from '@sudoplatform/sudo-virtual-cards-simulator'
import { v4 } from 'uuid'
import waitForExpect from 'wait-for-expect'
import {
  APIResultStatus,
  CardNotFoundError,
  CardState,
  SudoVirtualCardsClient,
  Transaction,
  TransactionType,
  VirtualCard,
} from '../../../src'
import { ProviderAPIs } from '../util/getProviderAPIs'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('CancelVirtualCard Test Suite', () => {
  jest.setTimeout(240000)
  waitForExpect.defaults.interval = 250
  waitForExpect.defaults.timeout = 5000

  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let profilesClient: SudoProfilesClient
  let vcSimulator: SudoVirtualCardsSimulatorClient
  let sudo: Sudo
  let apis: ProviderAPIs
  let merchant: SimulatorMerchant
  let beforeEachComplete = false

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    vcSimulator = result.virtualCardsSimulatorClient
    sudo = result.sudo
    apis = result.apis

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

  describe('cancelVirtualCard', () => {
    let card: VirtualCard

    let innerBeforeEachComplete = false
    beforeEach(async () => {
      card = await provisionVirtualCard(
        instanceUnderTest,
        profilesClient,
        sudo,
        apis,
      )
      innerBeforeEachComplete = true
    })

    function expectSetupComplete(): void {
      expect({ beforeEachComplete, innerBeforeEachComplete }).toEqual({
        beforeEachComplete: true,
        innerBeforeEachComplete: true,
      })
    }

    it('returns expected output', async () => {
      expectSetupComplete()

      const result = await instanceUnderTest.cancelVirtualCard({ id: card.id })
      expect(result).toBeDefined()
      expect(result.status).toBe(APIResultStatus.Success)
      expect(result.result).toMatchObject({
        id: card.id,
        state: CardState.Closed,
      })
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

      let lastTransaction: Transaction | undefined
      await waitForExpect(async () => {
        const gottenCard = await instanceUnderTest.getVirtualCard({
          id: card.id,
          cachePolicy: CachePolicy.RemoteOnly,
        })

        lastTransaction = gottenCard?.lastTransaction
        expect(lastTransaction).toBeDefined()
      })

      expect(lastTransaction).toMatchObject<Partial<Transaction>>({
        billedAmount: { currency: 'USD', amount: 50 },
        transactedAmount: { currency: 'USD', amount: 50 },
        description: merchant.name,
        type: TransactionType.Pending,
      })

      const result = await instanceUnderTest.cancelVirtualCard({ id: card.id })
      expect(result).toBeDefined()
      expect(result.status).toBe(APIResultStatus.Success)
      expect(result.result).toMatchObject({
        id: card.id,
        state: CardState.Closed,
        lastTransaction,
      })
    })

    it('throws CardNotFoundError for non-existent id', async () => {
      expectSetupComplete()

      await expect(
        instanceUnderTest.cancelVirtualCard({
          id: v4(),
        }),
      ).rejects.toThrow(CardNotFoundError)
    })
  })
})
