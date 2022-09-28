import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import {
  FundingSource,
  FundingSourceState,
  SudoVirtualCardsClient,
  VirtualCard,
} from '../../../src'
import { createCardFundingSource } from '../util/createFundingSource'
import { ProviderAPIs } from '../util/getProviderAPIs'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('UpdateVirtualCardFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('UpdateVirtualCardFundingSourceTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let profilesClient: SudoProfilesClient
  let sudo: Sudo
  let apis: ProviderAPIs

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    sudo = result.sudo
    apis = result.apis
  })

  describe('updateVirtualCardFundingSource', () => {
    let card: VirtualCard
    const fundingSourcesToCancel: FundingSource[] = []
    beforeEach(async () => {
      card = await provisionVirtualCard(
        instanceUnderTest,
        profilesClient,
        sudo,
        apis,
      )
    })
    afterEach(async () => {
      if (fundingSourcesToCancel.length > 0) {
        await Promise.all(
          fundingSourcesToCancel.map((fs) =>
            instanceUnderTest.cancelFundingSource(fs.id),
          ),
        )
      }
    })
    it('updates card funding source by default - update flag not set', async () => {
      const currentFundingSourceId = card.fundingSourceId

      // Cancel funding source of the card
      const cancelled = await instanceUnderTest.cancelFundingSource(
        currentFundingSourceId,
      )
      expect(cancelled.id).toEqual(currentFundingSourceId)
      expect(cancelled.state).toEqual(FundingSourceState.Inactive)

      // Create new funding source
      const newFundingSource = await createCardFundingSource(
        instanceUnderTest,
        apis,
      )

      fundingSourcesToCancel.push(newFundingSource)

      // Retrieve the card and ensure it has the new funding source
      const updatedCard = await instanceUnderTest.getVirtualCard({
        id: card.id,
        cachePolicy: CachePolicy.RemoteOnly,
      })

      if (!updatedCard) {
        fail('no updated cardfound')
      }

      expect(updatedCard.fundingSourceId).toEqual(newFundingSource.id)
    })
    it('updates card funding source - update flag set to true', async () => {
      const currentFundingSourceId = card.fundingSourceId

      // Cancel funding source of the card
      const cancelled = await instanceUnderTest.cancelFundingSource(
        currentFundingSourceId,
      )
      expect(cancelled.id).toEqual(currentFundingSourceId)
      expect(cancelled.state).toEqual(FundingSourceState.Inactive)

      // Create new funding source
      const newFundingSource = await createCardFundingSource(
        instanceUnderTest,
        apis,
        {
          updateCardFundingSource: true,
        },
      )

      fundingSourcesToCancel.push(newFundingSource)

      // Retrieve the card and ensure it has the new funding source
      const updatedCard = await instanceUnderTest.getVirtualCard({
        id: card.id,
        cachePolicy: CachePolicy.RemoteOnly,
      })

      if (!updatedCard) {
        fail('no updated cardfound')
      }

      expect(updatedCard.fundingSourceId).toEqual(newFundingSource.id)
    })
    it('does not update card funding source - update flag set to false', async () => {
      const oldFundingSourceId = card.fundingSourceId

      // Cancel funding source of the card
      const cancelled = await instanceUnderTest.cancelFundingSource(
        oldFundingSourceId,
      )
      expect(cancelled.id).toEqual(oldFundingSourceId)
      expect(cancelled.state).toEqual(FundingSourceState.Inactive)

      // Create new funding source
      const newFundingSource = await createCardFundingSource(
        instanceUnderTest,
        apis,
        {
          updateCardFundingSource: false,
        },
      )

      fundingSourcesToCancel.push(newFundingSource)

      // Retrieve the card and ensure it still has the old / cancelled funding source
      const updatedCard = await instanceUnderTest.getVirtualCard({
        id: card.id,
        cachePolicy: CachePolicy.RemoteOnly,
      })

      if (!updatedCard) {
        fail('no updated cardfound')
      }

      expect(updatedCard.fundingSourceId).toEqual(oldFundingSourceId)
    })
  })
})
