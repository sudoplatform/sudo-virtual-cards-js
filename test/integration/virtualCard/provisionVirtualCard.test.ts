import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import { v4 } from 'uuid'
import waitForExpect from 'wait-for-expect'
import {
  CardState,
  ProvisioningState,
  ProvisionVirtualCardInput,
  SudoVirtualCardsClient,
} from '../../../src'
import { createCardFundingSource } from '../util/createFundingSource'
import { FundingSourceProviders } from '../util/getFundingSourceProviders'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('ProvisionVirtualCard Test Suite', () => {
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

  describe('provisionVirtualCard', () => {
    it('returns expected output', async () => {
      if (!sudo.id) {
        fail('no sudo id')
      }
      const fundingSource = await createCardFundingSource(
        instanceUnderTest,
        fundingSourceProviders,
      )
      const ownershipProof = await profilesClient.getOwnershipProof(
        sudo.id,
        'sudoplatform.virtual-cards.virtual-card',
      )
      const alias = v4()

      const input: ProvisionVirtualCardInput = {
        ownershipProofs: [ownershipProof],
        fundingSourceId: fundingSource.id,
        cardHolder: 'cardMaxPerSudo:null',
        alias,
        currency: 'USD',
        billingAddress: {
          addressLine1: '222333 Peachtree Place',
          city: 'Atlanta',
          state: 'GA',
          postalCode: '30318',
          country: 'US',
        },
        metadata: {
          alias,
          color: 'red',
        },
      }

      const result = await instanceUnderTest.provisionVirtualCard(input)

      await waitForExpect(
        async () => {
          const provisionalCard = await instanceUnderTest.getProvisionalCard({
            id: result.id,
            cachePolicy: CachePolicy.RemoteOnly,
          })
          expect(provisionalCard).toMatchObject({
            provisioningState: ProvisioningState.Completed,
          })
          expect(provisionalCard?.card).toMatchObject({
            state: CardState.Issued,
            currency: 'USD',
            cardHolder: input.cardHolder,
            billingAddress: input.billingAddress,
            alias: input.alias ?? '',
            metadata: input.metadata,
          })
        },
        15000,
        1000,
      )
    })
  })
})
