import { CachePolicy, DefaultLogger } from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import Stripe from 'stripe'
import { v4 } from 'uuid'
import waitForExpect from 'wait-for-expect'
import { ProvisioningState, SudoVirtualCardsClient } from '../../../src'
import { createFundingSource } from '../util/createFundingSource'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('ProvisionVirtualCard Test Suite', () => {
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

  describe('provisionVirtualCard', () => {
    it('returns expected output', async () => {
      if (!sudo.id) {
        fail('no sudo id')
      }
      const fundingSource = await createFundingSource(instanceUnderTest, stripe)
      const ownershipProof = await profilesClient.getOwnershipProof(
        sudo.id,
        'sudoplatform.virtual-cards.virtual-card',
      )
      const alias = v4()
      const result = await instanceUnderTest.provisionVirtualCard({
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
      })
      await waitForExpect(
        async () => {
          await expect(
            instanceUnderTest.getProvisionalCard({
              id: result.id,
              cachePolicy: CachePolicy.RemoteOnly,
            }),
          ).resolves.toMatchObject({
            provisioningState: ProvisioningState.Completed,
          })
        },
        15000,
        1000,
      )
    })
    it('provision two cards', async () => {
      if (!sudo.id) {
        fail('no sudo id')
      }
      const fundingSource = await createFundingSource(instanceUnderTest, stripe)
      const ownershipProof = await profilesClient.getOwnershipProof(
        sudo.id,
        'sudoplatform.virtual-cards.virtual-card',
      )
      const alias = v4()
      const provisionInput = {
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
      }
      const results = await Promise.all([
        instanceUnderTest.provisionVirtualCard(provisionInput),
        instanceUnderTest.provisionVirtualCard(provisionInput),
      ])
      console.log({ results })
    })
  })
})
