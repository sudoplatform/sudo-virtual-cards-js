import { PublicKey, PublicKeyFormat } from '@sudoplatform/sudo-common'
import { CardState } from '../../../src'
import { TransactionType } from '../../../src/gen/graphqlTypes'
import { DeviceKey } from '../../../src/private/data/common/deviceKeyWorker'
import { TransactionUnsealed } from '../../../src/private/data/common/transactionWorker'
import { VirtualCardUnsealed } from '../../../src/private/data/virtualCard/defaultVirtualCardService'

export class ServiceDataFactory {
  static readonly sudoCommonPublicKey: PublicKey = {
    keyData: new TextEncoder().encode('dummyKeyData').buffer,
    keyFormat: PublicKeyFormat.RSAPublicKey,
  }
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
        fundingSourceId: 'dummyFundingSourceId',
        description: 'dummyFundingSourceDescription',
      },
    ],
  }
}
