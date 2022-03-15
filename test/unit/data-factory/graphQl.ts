import { Base64, EncryptionAlgorithm } from '@sudoplatform/sudo-common'
import {
  CardState,
  CardType,
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
  SealedAttribute,
  SealedCard,
  SealedCurrencyAmountAttribute,
  SealedTransaction,
  StateReason,
  TransactionType,
  VirtualCardsConfig,
} from '../../../src/gen/graphqlTypes'

export class GraphQLDataFactory {
  private static readonly commonProps = {
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
    id: 'dummyFundingSourceId',
    state: ProvisionalFundingSourceState.Completed,
    stateReason: StateReason.Unlocked,
    provisioningData: this.provisioningData,
  }

  static readonly fundingSource: FundingSource = {
    ...GraphQLDataFactory.commonProps,
    id: 'dummyFundingSourceId',
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
    id: 'dummyVirtualCardId',
    clientRefId: 'dummyClientRefId',
    provisioningState: ProvisioningState.Provisioning,
  }

  static readonly sealedCardMetadata: SealedAttribute = {
    algorithm: EncryptionAlgorithm.AesCbcPkcs7Padding,
    keyId: 'dummySymmetricKeyId',
    plainTextType: 'json-string',
    base64EncodedSealedData: 'dummyBase64EncodedSealedData',
  }

  static readonly sealedCard: SealedCard = {
    ...this.commonProps,
    id: 'dummyVirtualCardId',
    activeToEpochMs: 3.0,
    algorithm: 'RSAEncryptionOAEPAESCBC',
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
    metadata: { ...this.sealedCardMetadata },
  }

  static readonly publicKey: PublicKey = {
    ...this.commonProps,
    id: 'dummyKeyId',
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
    id: 'dummyTransactionId',
    algorithm: 'RSAEncryptionOAEPAESCBC',
    billedAmount: this.sealedCurrencyAmount,
    cardId: 'dummyVirtualCardId',
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
    sortDateEpochMs: 100.0,
    transactedAmount: this.sealedCurrencyAmount,
    transactedAtEpochMs: 'SEALED-NUMBER',
    type: TransactionType.Pending,
  }

  static readonly sealedSettledTransaction: SealedTransaction = {
    ...this.commonProps,
    id: 'dummyTransactionId',
    algorithm: 'RSAEncryptionOAEPAESCBC',
    billedAmount: this.sealedCurrencyAmount,
    cardId: 'dummyVirtualCardId',
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
    sortDateEpochMs: 120.0,
    transactedAmount: this.sealedCurrencyAmount,
    transactedAtEpochMs: 'SEALED-NUMBER',
    type: TransactionType.Complete,
  }

  static readonly configurationData: VirtualCardsConfig = {
    fundingSourceSupportInfo: [
      {
        detail: [{ cardType: CardType.Credit }],
        fundingSourceType: 'card',
        network: 'VISA',
        providerType: 'stripe',
      },
    ],
    maxCardCreationVelocity: ['5/P1D'],
    maxFundingSourceVelocity: ['5/P1D'],
    maxFundingSourceFailureVelocity: [''],
    maxTransactionAmount: [
      {
        currency: 'USD',
        amount: '25000',
      },
    ],
    maxTransactionVelocity: [
      {
        currency: 'USD',
        velocity: ['25000/P1D'],
      },
    ],
    virtualCardCurrencies: ['USD'],
  }
}
