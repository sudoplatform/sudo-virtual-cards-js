/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { PublicKey, PublicKeyFormat } from '@sudoplatform/sudo-common'
import { ChargeDetailState } from '../../../src'
import { TransactionType } from '../../../src/gen/graphqlTypes'
import { DeviceKey } from '../../../src/private/data/common/deviceKeyWorker'
import { TransactionUnsealed } from '../../../src/private/data/common/transactionWorker'
import { VirtualCardUnsealed } from '../../../src/private/data/virtualCard/virtualCardSealedAttributes'
import { CardState } from '../../../src/public/typings/virtualCard'

export class ServiceDataFactory {
  static readonly sudoCommonPublicKey: PublicKey = {
    keyData: new TextEncoder().encode('dummyKeyData').buffer,
    keyFormat: PublicKeyFormat.RSAPublicKey,
  }

  static readonly symmetricKeyId = 'dummySymmetricKeyId'

  static readonly deviceKey: DeviceKey = {
    id: 'dummyId',
    keyRingId: 'dummyKeyRingId',
    algorithm: 'dummyAlgorithm',
    data: 'dummyKeyData',
    format: PublicKeyFormat.RSAPublicKey,
  }

  static readonly virtualCardUnsealed: VirtualCardUnsealed = {
    id: 'dummyVirtualCardId',
    owner: 'dummyOwner',
    version: 1,
    createdAtEpochMs: 1.0,
    updatedAtEpochMs: 2.0,
    owners: [
      {
        id: 'dummyOwnerId',
        issuer: 'dummyIssuer',
      },
    ],
    fundingSourceId: 'dummyFundingSourceId',
    currency: 'dummyCurrency',
    state: CardState.Issued,
    activeToEpochMs: 3.0,
    cancelledAtEpochMs: undefined,
    last4: 'dummyLast4',
    cardHolder: 'dummyCardHolder',
    alias: 'dummyAlias',
    pan: 'dummyPan',
    csc: 'dummyCsc',
    billingAddress: {
      addressLine1: 'dummyAddressLine1',
      addressLine2: 'dummyAddressLine2',
      city: 'city',
      state: 'state',
      country: 'country',
      postalCode: 'postalCode',
    },
    expiry: {
      mm: 'mm',
      yyyy: 'yyyy',
    },
    metadata: {
      alias: 'metadata-alias',
      color: 'metadata-color',
    },
  }

  static readonly transactionUnsealed: TransactionUnsealed = {
    id: 'dummyTransactionId',
    owner: 'dummyOwner',
    version: 1,
    createdAtEpochMs: 1.0,
    updatedAtEpochMs: 2.0,
    sortDateEpochMs: 100.0,
    cardId: 'dummyVirtualCardId',
    sequenceId: 'dummySequenceId',
    type: TransactionType.Pending,
    billedAmount: { currency: 'USD', amount: 100 },
    transactedAmount: { currency: 'USD', amount: 100 },
    description: 'dummyDescription',
    transactedAtEpochMs: 100.0,
    detail: [
      {
        virtualCardAmount: { currency: 'USD', amount: 100 },
        markup: {
          percent: 299,
          flat: 31,
          minCharge: 50,
        },
        markupAmount: { currency: 'USD', amount: 23 },
        fundingSourceAmount: { currency: 'USD', amount: 123 },
        transactedAt: new Date(100),
        settledAt: new Date(100),
        fundingSourceId: 'dummyFundingSourceId',
        description: 'dummyFundingSourceDescription',
        state: ChargeDetailState.Cleared,
        continuationOfExistingCharge: false,
      },
    ],
  }

  static readonly settledTransactionUnsealed: TransactionUnsealed = {
    id: 'dummyTransactionId',
    owner: 'dummyOwner',
    version: 1,
    createdAtEpochMs: 1.0,
    updatedAtEpochMs: 2.0,
    sortDateEpochMs: 120.0,
    cardId: 'dummyVirtualCardId',
    sequenceId: 'dummySequenceId',
    type: TransactionType.Complete,
    billedAmount: { currency: 'USD', amount: 100 },
    transactedAmount: { currency: 'USD', amount: 100 },
    description: 'dummyDescription',
    transactedAtEpochMs: 100.0,
    settledAtEpochMs: 120.0,
    detail: [
      {
        virtualCardAmount: { currency: 'USD', amount: 100 },
        markup: {
          percent: 299,
          flat: 31,
          minCharge: 50,
        },
        markupAmount: { currency: 'USD', amount: 23 },
        fundingSourceAmount: { currency: 'USD', amount: 123 },
        transactedAt: new Date(100),
        settledAt: new Date(120),
        fundingSourceId: 'dummyFundingSourceId',
        description: 'dummyFundingSourceDescription',
        state: ChargeDetailState.Cleared,
        continuationOfExistingCharge: false,
      },
    ],
  }
}
