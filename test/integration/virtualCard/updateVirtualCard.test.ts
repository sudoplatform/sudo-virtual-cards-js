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
  SudoVirtualCardsClient,
  Transaction,
  TransactionType,
  VirtualCard,
} from '../../../src'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('UpdateVirtualCard Test Suite', () => {
  jest.setTimeout(240000)
  waitForExpect.defaults.interval = 250
  waitForExpect.defaults.timeout = 5000

  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let profilesClient: SudoProfilesClient
  let vcSimulator: SudoVirtualCardsSimulatorClient
  let sudo: Sudo
  let fundingSourceProviders: FundingSourceProviders
  let merchant: SimulatorMerchant
  let beforeEachComplete = false

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    vcSimulator = result.virtualCardsSimulatorClient
    sudo = result.sudo
    fundingSourceProviders = result.fundingSourceProviders

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

  describe('updateVirtualCard', () => {
    let card: VirtualCard
    let innerBeforeEachComplete = false
    beforeEach(async () => {
      card = await provisionVirtualCard(
        instanceUnderTest,
        profilesClient,
        sudo,
        fundingSourceProviders,
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
        lastTransaction,
      })
    })

    it('throws CardNotFoundError for non-existent id', async () => {
      expectSetupComplete()

      await expect(
        instanceUnderTest.updateVirtualCard({
          id: v4(),
          cardHolder: 'newCardHolder',
          alias: 'newAlias',
          billingAddress: undefined,
        }),
      ).rejects.toThrow(CardNotFoundError)
    })

    it('can clear billing address by updating to null while leaving other properties unchanged', async () => {
      expectSetupComplete()

      const update = await instanceUnderTest.updateVirtualCard({
        id: card.id,
        billingAddress: null,
      })
      expect(update.status).toEqual(APIResultStatus.Success)
      if (update.status !== APIResultStatus.Success) {
        fail('update status unexpectedly unsuccessful')
      }
      const updated = update.result

      // Billing address may either be undefined or empty string
      // depending on environment
      expect([undefined, '']).toContainEqual(updated.billingAddress)

      // updatedAt and version should be updated but all other properties should be unchanged
      expect(updated).toEqual({
        ...card,
        updatedAt: updated.updatedAt,
        version: updated.version,
        billingAddress: updated.billingAddress,
      })
    })

    it('can clear metadata by updating to null while leaving other properties unchanged', async () => {
      expectSetupComplete()

      const update = await instanceUnderTest.updateVirtualCard({
        id: card.id,
        metadata: null,
      })
      expect(update.status).toEqual(APIResultStatus.Success)
      if (update.status !== APIResultStatus.Success) {
        fail('update status unexpectedly unsuccessful')
      }
      const updated = update.result
      expect(updated).toEqual({
        ...card,
        updatedAt: updated.updatedAt,
        version: updated.version,
        metadata: undefined,
      })
    })
  })
})
