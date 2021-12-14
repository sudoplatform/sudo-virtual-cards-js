import {
  DefaultLogger,
  ListOperationResultStatus,
} from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import Stripe from 'stripe'
import {
  ProvisionalVirtualCard,
  SudoVirtualCardsClient,
  VirtualCard,
} from '../../../src'
import { createFundingSource } from '../util/createFundingSource'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('ListProvisionalCards Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let profilesClient: SudoProfilesClient
  let sudo: Sudo
  let stripe: Stripe

  beforeAll(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    sudo = result.sudo
    stripe = result.stripe
  })

  describe('listProvisionalCards', () => {
    let cards: VirtualCard[] = []
    beforeAll(async () => {
      const fundingSource = await createFundingSource(instanceUnderTest, stripe)
      const provisionCardFn = async (): Promise<VirtualCard> => {
        return await provisionVirtualCard(
          instanceUnderTest,
          profilesClient,
          sudo,
          stripe,
          {
            fundingSourceId: fundingSource.id,
          },
        )
      }
      // Create 5 cards
      // To avoid race condition, create one card first
      cards.push(await provisionCardFn())
      const created = await Promise.all([
        provisionCardFn(),
        provisionCardFn(),
        provisionCardFn(),
        provisionCardFn(),
      ])
      cards.push(...created)
      expect(cards).toHaveLength(5)
    })

    afterAll(() => {
      cards = []
    })
    it('returns expected output', async () => {
      const result = await instanceUnderTest.listProvisionalCards()
      if (result.status !== ListOperationResultStatus.Success) {
        fail(`Wrong status: ${result.status}`)
      }
      expect(result.items).toHaveLength(5)
    })
    it('filters cards as expected', async () => {
      const result = await instanceUnderTest.listProvisionalCards({
        filter: { id: { ne: cards[0].id } },
      })
      if (result.status !== ListOperationResultStatus.Success) {
        fail(`Wrong status: ${result.status}`)
      }
      expect(result.items).toHaveLength(4)
    })
    it('limits cards as expected', async () => {
      const result = await instanceUnderTest.listProvisionalCards({ limit: 1 })
      if (result.status !== ListOperationResultStatus.Success) {
        fail(`Wrong status: ${result.status}`)
      }
      expect(result.items).toHaveLength(1)
    })
    it('respects pagination', async () => {
      const cardResult: ProvisionalVirtualCard[] = []
      let calls = 0
      do {
        calls++
        const result = await instanceUnderTest.listProvisionalCards({
          limit: 1,
        })
        if (result.status !== ListOperationResultStatus.Success) {
          fail(`Wrong status: ${result.status}`)
        }
        cardResult.push(...result.items)
      } while (calls < 5)
      expect(calls).toEqual(5)
      expect(cardResult).toHaveLength(5)
    })
  })
})
