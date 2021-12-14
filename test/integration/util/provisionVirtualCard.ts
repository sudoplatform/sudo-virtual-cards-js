import { CachePolicy } from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import Stripe from 'stripe'
import { v4 } from 'uuid'
import {
  BillingAddress,
  ProvisioningState,
  SudoVirtualCardsClient,
  VirtualCard,
} from '../../../src'
import { delay } from '../../utility/delay'
import { createFundingSource } from './createFundingSource'

const optBillingAddress: BillingAddress = {
  addressLine1: '222333 Peachtree Place',
  city: 'Atlanta',
  state: 'GA',
  postalCode: '30318',
  country: 'US',
}

export const provisionVirtualCard = async (
  virtualCardsClient: SudoVirtualCardsClient,
  profilesClient: SudoProfilesClient,
  sudo: Sudo,
  stripe?: Stripe,
  options?: {
    alias?: string
    fundingSourceId?: string
    ownershipProofs?: string[]
    cardHolder?: string
    currency?: string
    billingAddress?: BillingAddress
  },
): Promise<VirtualCard> => {
  const cardHolder = options?.cardHolder ?? 'cardMaxPerSudo:null'
  const currency = options?.currency ?? 'USD'
  const billingAddress = options?.billingAddress ?? optBillingAddress
  const alias = options?.alias ?? v4()
  let fundingSourceId
  if (!options?.fundingSourceId) {
    if (!stripe) {
      throw new Error(
        'Stripe must be included if no fundingSourceId is included',
      )
    }
    const { id } = await createFundingSource(virtualCardsClient, stripe)
    fundingSourceId = id
  } else {
    fundingSourceId = options.fundingSourceId
  }
  const ownershipProofs = []
  if (!options?.ownershipProofs) {
    if (!sudo.id) {
      throw new Error('sudo with id required')
    }
    const oProof = await profilesClient.getOwnershipProof(
      sudo.id,
      'sudoplatform.virtual-cards.virtual-card',
    )
    ownershipProofs.push(oProof)
  }
  const { id: provisionalId } = await virtualCardsClient.provisionVirtualCard({
    alias,
    ownershipProofs,
    fundingSourceId,
    cardHolder,
    currency,
    billingAddress,
  })
  let card: VirtualCard | undefined
  for (let i = 0; i < 15; ++i) {
    const result = await virtualCardsClient.getProvisionalCard({
      id: provisionalId,
      cachePolicy: CachePolicy.RemoteOnly,
    })
    if (
      result?.provisioningState === ProvisioningState.Completed &&
      result.card
    ) {
      card = result.card
      break
    } else {
      await delay(1000)
      continue
    }
  }
  if (!card) {
    throw new Error('Failed to get provisioned card after calling provisioning')
  }
  return card
}
