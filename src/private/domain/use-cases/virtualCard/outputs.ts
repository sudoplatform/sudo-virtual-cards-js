import { CardState } from '../../../../public/typings/virtualCard'
import { VirtualCardBillingAddress } from './virtualCardBillingAddress'

export interface VirtualCardUseCaseOutput {
  id: string
  owners: {
    id: string
    issuer: string
  }[]
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  fundingSourceId: string
  currency: string
  state: CardState
  activeTo: Date
  cancelledAt?: Date | undefined
  last4: string
  cardHolder: string
  alias: string
  pan: string
  csc: string
  billingAddress?: VirtualCardBillingAddress | undefined
  expiry: {
    mm: string
    yyyy: string
  }
}

export interface VirtualCardSealedAttributesUseCaseOutput {
  cardHolder: string
  alias: string
  pan: string
  csc: string
  billingAddress?: VirtualCardBillingAddress
  expiry: {
    mm: string
    yyyy: string
  }
}
