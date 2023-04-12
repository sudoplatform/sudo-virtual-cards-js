/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Owner } from '@sudoplatform/sudo-common'
import { Metadata } from './metadata'
import { Transaction } from './transaction'

/**
 * Virtual Card sealed attributes.
 *
 * @property {string} cardHolder Name of the virtual card holder.
 * @property {string} pan Permanent Account Number of the virtual card.
 * @property {string} csc Card Security Code of the virtual card.
 * @property {string} billingAddress Billing address associated with the virtual card.
 * @property {string} expiry Expiry information of the card.
 */
export interface VirtualCardSealedAttributes {
  cardHolder: string
  pan: string
  csc: string
  billingAddress?: BillingAddress
  expiry: Expiry

  /** @deprecated Use client side sealed metadata instead */
  alias: string
}

/**
 * Fully Provisioned Virtual Card.

 * @property {string} id Identifier of the virtual card.
 * @property {string} owner Owner Identifier of the virtual card.
 * @property {number} version Current version record of the virtual card.
 * @property {Date} createdAt Date of when the virtual card was created.
 * @property {Date} updatedAt Date of when the virtual card was last updated.
 * @property {Owner[]} owners Owner identifiers associated with the virtual card.
 * @property {string} fundingSourceId Identifier of the funding source associated with the virtual card.
 * @property {string} currency Provisioned currency of the virtual card.
 * @property {CardState} state State of the card.
 * @property {Date} activeTo Date of when the card is active to.
 * @property {Date} cancelledAt If the card is inactive, date when card became inactive.
 * @property {string} last4 Last 4 digits of the virtual card.
 * @property {string} cardHolder Name of the virtual card holder.
 * @property {string} pan Permanent Account Number of the virtual card.
 * @property {string} csc Card Security Code of the virtual card.
 * @property {string} billingAddress Billing address associated with the virtual card.
 * @property {string} expiry Expiry information of the card.
 * @property {Transaction} lastTransaction Most recent transaction, if any, that has occurred on the card.
 * @property {JSONValue} metadata Client side sealed arbitrary metadata object
 */
export interface VirtualCard extends VirtualCardSealedAttributes {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  owners: Owner[]
  fundingSourceId: string
  currency: string
  state: CardState
  activeTo: Date
  cancelledAt?: Date
  last4: string
  cardHolder: string
  pan: string
  csc: string
  billingAddress?: BillingAddress | undefined
  expiry: Expiry
  lastTransaction?: Transaction
  metadata?: Metadata

  /** @deprecated Store alias as a property of metadata instead */
  alias: string
}

/**
 * Billing address of a Virtual Card.
 *
 * @property {string} addressLine1 First line of the billing address.
 * @property {string} addressLine2 Second line of the billing address.
 * @property {string} city City of the billing address.
 * @property {string} state State of the billing address.
 * @property {string} postalCode Postal Code of the billing address.
 * @property {string} country Country of the billing address.
 */
export interface BillingAddress {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

/**
 * Virtual Card Expiry information.
 *
 * @property {string} mm Month in format MM - e.g. 12.
 * @property {string} yyyy Year in format YYYY - e.g. 2020.
 */
export interface Expiry {
  mm: string
  yyyy: string
}

/**
 * Virtual card state.
 */
export enum CardState {
  Issued = 'ISSUED',
  Failed = 'FAILED',
  Closed = 'CLOSED',
  Suspended = 'SUSPENDED',
}
