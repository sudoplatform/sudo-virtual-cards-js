import { PublicKey, PublicKeyFormat } from '@sudoplatform/sudo-common'
import { CardState } from '../../../src'
import { DeviceKey } from '../../../src/private/data/common/deviceKeyWorker'
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
    id: 'dummyId',
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
}
