import { ProvisionalCard } from '../../../gen/graphqlTypes'
import { Metadata } from '../../../public/typings/metadata'
import { CardState } from '../../../public/typings/virtualCard'
import { TransactionEntity } from '../../domain/entities/transaction/transactionEntity'
import { TransactionUnsealed } from '../common/transactionWorker'

export interface VirtualCardBillingAddress {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface VirtualCardExpiry {
  mm: string
  yyyy: string
}

export interface VirtualCardSealedAttributes {
  cardHolder: string
  alias: string
  pan: string
  csc: string
  billingAddress?: VirtualCardBillingAddress
  expiry: VirtualCardExpiry
  lastTransaction?: TransactionEntity
  metadata?: Metadata
}

export interface VirtualCardUnsealed {
  id: string
  owner: string
  version: number
  createdAtEpochMs: number
  updatedAtEpochMs: number
  owners: {
    id: string
    issuer: string
  }[]
  fundingSourceId: string
  currency: string
  state: CardState
  activeToEpochMs: number
  cancelledAtEpochMs?: number | null
  last4: string
  cardHolder: string
  alias?: string
  pan: string
  csc: string
  billingAddress?: VirtualCardBillingAddress
  expiry: VirtualCardExpiry
  lastTransaction?: TransactionUnsealed
  metadata?: Metadata
}

export type ProvisionalCardUnsealed = Omit<ProvisionalCard, 'card'> & {
  card?: VirtualCardUnsealed | undefined
}
