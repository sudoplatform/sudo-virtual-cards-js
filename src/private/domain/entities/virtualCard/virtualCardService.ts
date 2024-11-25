/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CachePolicy, ListOperationResult } from '@sudoplatform/sudo-common'
import { APIResult } from '../../../../public/typings/apiResult'
import { Metadata } from '../../../../public/typings/metadata'
import { VirtualCardSealedAttributes } from '../../../data/virtualCard/virtualCardSealedAttributes'
import { ProvisionalVirtualCardEntity } from './provisionalVirtualCardEntity'
import { VirtualCardEntity } from './virtualCardEntity'
import { SortOrder, VirtualCardFilterInput } from '../../../../public'

export interface VirtualCardServiceProvisionVirtualCardInput {
  clientRefId?: string
  ownershipProofs: string[]
  fundingSourceId: string
  cardHolder: string
  currency: string
  billingAddress?: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  metadata?: Metadata
  alias?: string
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
  cardHolder?: string
  billingAddress?: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  } | null
  metadata?: Metadata | null

  /** @deprecated */
  alias?: string | null
}

export interface VirtualCardServiceListVirtualCardsInput {
  filterInput?: VirtualCardFilterInput
  sortOrder?: SortOrder
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
}

export interface VirtualCardServiceGetProvisionalCardInput {
  id: string
  cachePolicy?: CachePolicy
}

export interface VirtualCardServiceListProvisionalCardsInput {
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
