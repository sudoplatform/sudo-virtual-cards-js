import { CachePolicy, ListOperationResult } from '@sudoplatform/sudo-common'
import { APIResult } from '../../../..'
import {
  ProvisionalCardFilter,
  VirtualCardFilter,
} from '../../../../public/typings/filters'
import { VirtualCardSealedAttributes } from '../../../data/virtualCard/defaultVirtualCardService'
import { ProvisionalVirtualCardEntity } from './provisionalVirtualCardEntity'
import { VirtualCardEntity } from './virtualCardEntity'

export interface VirtualCardServiceProvisionVirtualCardInput {
  clientRefId?: string
  ownershipProofs: string[]
  fundingSourceId: string
  cardHolder: string
  alias: string
  billingAddress?: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  currency: string
}

export interface VirtualCardServiceCancelCardInput {
  id: string
}

export interface VirtualCardServiceGetVirtualCardInput {
  id: string
  cachePolicy?: CachePolicy
}

export interface VirtualCardServiceUpdateVirtualCardUseCaseInput {
  id: string
  expectedCardVersion?: number
  cardHolder: string
  alias: string
  billingAddress:
    | {
        addressLine1: string
        addressLine2?: string
        city: string
        state: string
        postalCode: string
        country: string
      }
    | undefined
}

export interface VirtualCardServiceListVirtualCardsInput {
  filter?: VirtualCardFilter
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
}

export interface VirtualCardServiceGetProvisionalCardInput {
  id: string
  cachePolicy?: CachePolicy
}

export interface VirtualCardServiceListProvisionalCardsInput {
  filter?: ProvisionalCardFilter
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
}

export interface VirtualCardService {
  provisionVirtualCard(
    input: VirtualCardServiceProvisionVirtualCardInput,
  ): Promise<ProvisionalVirtualCardEntity>

  updateVirtualCard(
    input: VirtualCardServiceUpdateVirtualCardUseCaseInput,
  ): Promise<APIResult<VirtualCardEntity, VirtualCardSealedAttributes>>

  cancelVirtualCard(
    input: VirtualCardServiceCancelCardInput,
  ): Promise<APIResult<VirtualCardEntity, VirtualCardSealedAttributes>>

  getVirtualCard(
    input: VirtualCardServiceGetVirtualCardInput,
  ): Promise<VirtualCardEntity | undefined>

  listVirtualCards(
    input?: VirtualCardServiceListVirtualCardsInput,
  ): Promise<
    ListOperationResult<VirtualCardEntity, VirtualCardSealedAttributes>
  >

  getProvisionalCard(
    input: VirtualCardServiceGetProvisionalCardInput,
  ): Promise<ProvisionalVirtualCardEntity | undefined>

  listProvisionalCards(
    input?: VirtualCardServiceListProvisionalCardsInput,
  ): Promise<ListOperationResult<ProvisionalVirtualCardEntity>>
}
