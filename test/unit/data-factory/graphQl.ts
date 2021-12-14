import { Base64 } from '@sudoplatform/sudo-common'
import {
  CardState,
  CreditCardNetwork,
  FundingSource,
  FundingSourceConnection,
  FundingSourceState,
  KeyFormat,
  ProvisionalCard,
  ProvisionalFundingSource,
  ProvisionalFundingSourceState,
  ProvisioningState,
  PublicKey,
  SealedCard,
  SealedCurrencyAmountAttribute,
  SealedTransaction,
  StateReason,
  TransactionType,
} from '../../../src/gen/graphqlTypes'

export class GraphQLDataFactory {
  private static readonly commonProps = {
    id: 'dummyId',
    owner: 'dummyOwner',
    version: 1,
    createdAtEpochMs: 1.0,
    updatedAtEpochMs: 2.0,
  }
  private static readonly provisioningData = Base64.encodeString(
    JSON.stringify({
      version: 1,
      provider: 'stripe',
      client_secret: 'dummyClientSecret',
      intent: 'dummyIntent',
    }),
  )

  static readonly provisionalFundingSource: ProvisionalFundingSource = {
    ...GraphQLDataFactory.commonProps,
    state: ProvisionalFundingSourceState.Completed,
    stateReason: StateReason.Unlocked,
    provisioningData: this.provisioningData,
  }

  static readonly fundingSource: FundingSource = {
    ...GraphQLDataFactory.commonProps,
    currency: 'dummyCurrency',
    last4: 'dummyLast4',
    network: CreditCardNetwork.Visa,
    state: FundingSourceState.Active,
  }

  static readonly fundingSourceConnection: FundingSourceConnection = {
    items: [GraphQLDataFactory.fundingSource],
    nextToken: undefined,
  }

  static readonly provisionalCard: ProvisionalCard = {
    ...this.commonProps,
    clientRefId: 'dummyClientRefId',
    provisioningState: ProvisioningState.Provisioning,
  }

  static readonly sealedCard: SealedCard = {
    ...this.commonProps,
    activeToEpochMs: 3.0,
    algorithm: 'AES/CBC/PKCS7Padding',
    keyId: 'dummyKeyId',
    keyRingId: 'dummyKeyRingId',
    alias: 'dummyAlias',
    billingAddress: {
      addressLine1: 'dummyAddressLine1',
      addressLine2: 'dummyAddressLine2',
      city: 'dummyCity',
      state: 'dummyState',
      country: 'dummyCountry',
      postalCode: 'dummyPostalCode',
    },
    cardHolder: 'dummyCardHolder',
    csc: 'dummyCsc',
    currency: 'dummyCurrency',
    expiry: {
      mm: 'mm',
      yyyy: 'yyyy',
    },
    fundingSourceId: 'dummyFundingSourceId',
    pan: 'dummyPan',
    state: CardState.Issued,
    last4: 'dummyLast4',
    owners: [{ id: 'dummyOwnerId', issuer: 'dummyIssuer' }],
  }

  static readonly publicKey: PublicKey = {
    ...this.commonProps,
    algorithm: 'dummyAlgorithm',
    keyFormat: KeyFormat.RsaPublicKey,
    keyId: 'dummyKeyId',
    keyRingId: 'dummyKeyRingId',
    publicKey: 'dummyPublicKey',
  }

  private static readonly sealedCurrencyAmount: SealedCurrencyAmountAttribute =
    {
      currency: 'dummyCurrency',
      amount: 'SEALED-NUMBER',
    }

  static readonly sealedTransaction: SealedTransaction = {
    ...this.commonProps,
    algorithm: 'AES/CBC/PKCS7Padding',
    billedAmount: this.sealedCurrencyAmount,
    cardId: 'dummyCardId',
    declineReason: 'dummyDeclineReason',
    description: 'dummyDescription',
    detail: [
      {
        description: 'dummyDescription',
        fundingSourceAmount: this.sealedCurrencyAmount,
        fundingSourceId: 'dummyFundingSourceId',
        markup: {
          percent: 'SEALED-NUMBER',
          flat: 'SEALED-NUMBER',
          minCharge: 'SEALED-NUMBER',
        },
        markupAmount: this.sealedCurrencyAmount,
        virtualCardAmount: this.sealedCurrencyAmount,
      },
    ],
    keyId: 'dummyKeyId',
    sequenceId: 'dummySequenceId',
    sortDateEpochMs: 3.0,
    transactedAmount: this.sealedCurrencyAmount,
    transactedAtEpochMs: 'SEALED-NUMBER',
    type: TransactionType.Complete,
  }
}
