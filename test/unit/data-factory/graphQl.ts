/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Base64, EncryptionAlgorithm } from '@sudoplatform/sudo-common'
import {
  CardState,
  CardType,
  CreditCardFundingSource,
  CreditCardNetwork,
  FundingSource,
  FundingSourceConnection,
  FundingSourceState,
  FundingSourceType,
  KeyFormat,
  ProvisionalCard,
  ProvisionalFundingSource,
  ProvisionalFundingSourceConnection,
  ProvisionalFundingSourceFilterInput,
  ProvisionalFundingSourceState,
  ProvisioningState,
  PublicKey,
  SealedAttribute,
  SealedCard,
  SealedCurrencyAmountAttribute,
  SealedTransaction,
  TransactionType,
  VirtualCardsConfig,
} from '../../../src/gen/graphqlTypes'
import { FundingSourceUnsealed } from '../../../src/private/data/fundingSource/fundingSourceSealedAttributes'

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
    provisioningData: this.provisioningData,
    last4: '1234',
  }

  static readonly provisionalFundingSourceFilter: ProvisionalFundingSourceFilterInput =
    {
      id: { eq: 'dummyFundingSourceId' },
      state: { eq: ProvisionalFundingSourceState.Completed },
    }

  static readonly provisionalFundingSourceFilterID: ProvisionalFundingSourceFilterInput =
    {
      id: { eq: 'dummyFundingSourceId' },
    }

  static readonly provisionalFundingSourceFilterState: ProvisionalFundingSourceFilterInput =
    {
      state: { eq: ProvisionalFundingSourceState.Completed },
    }

  static readonly provisionalFundingSourceFilterAnd: ProvisionalFundingSourceFilterInput =
    {
      and: [
        GraphQLDataFactory.provisionalFundingSourceFilterID,
        GraphQLDataFactory.provisionalFundingSourceFilterState,
      ],
    }

  static readonly provisionalFundingSourceFilterOr: ProvisionalFundingSourceFilterInput =
    {
      or: [
        GraphQLDataFactory.provisionalFundingSourceFilterID,
        GraphQLDataFactory.provisionalFundingSourceFilterState,
      ],
    }

  static readonly provisionalFundingSourceFilterNot: ProvisionalFundingSourceFilterInput =
    {
      not: GraphQLDataFactory.provisionalFundingSourceFilterOr,
    }

  static readonly provisionalFundingSourceConnection: ProvisionalFundingSourceConnection =
    {
      items: [GraphQLDataFactory.provisionalFundingSource],
      nextToken: undefined,
    }

  private static readonly commonFundingSourceUnsealedProps = {
    ...GraphQLDataFactory.commonProps,
    id: 'dummyFundingSourceId',
    currency: 'dummyCurrency',
    state: FundingSourceState.Active,
    flags: [],
    transactionVelocity: {
      __typename: 'TransactionVelocity' as const,
      maximum: 10000,
      velocity: ['10000/P1D'],
    },
  }

  static readonly creditCardfundingSource: CreditCardFundingSource = {
    ...GraphQLDataFactory.commonFundingSourceUnsealedProps,
    __typename: 'CreditCardFundingSource',
    cardType: CardType.Credit,
    last4: 'dummyLast4',
    network: CreditCardNetwork.Visa,
  }

  static readonly defaultFundingSource: FundingSource =
    this.creditCardfundingSource

  static readonly defaultFundingSourceUnsealed: FundingSourceUnsealed =
    this.creditCardfundingSource

  static readonly fundingSourceConnection: FundingSourceConnection = {
    items: [GraphQLDataFactory.creditCardfundingSource],
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
        transactedAtEpochMs: 'SEALED-NUMBER',
        settledAtEpochMs: 'SEALED-NUMBER',
        fundingSourceId: 'dummyFundingSourceId',
        markup: {
          percent: 'SEALED-NUMBER',
          flat: 'SEALED-NUMBER',
          minCharge: 'SEALED-NUMBER',
        },
        markupAmount: this.sealedCurrencyAmount,
        virtualCardAmount: this.sealedCurrencyAmount,
        state: 'dummyChargeDetailState',
        continuationOfExistingCharge: false,
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
        transactedAtEpochMs: 'SEALED-NUMBER',
        settledAtEpochMs: 'SEALED-NUMBER',
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
    maxFundingSourcePendingVelocity: [''],
    maxTransactionAmount: [
      {
        currency: 'USD',
        amount: 25000,
      },
    ],
    maxTransactionVelocity: [
      {
        currency: 'USD',
        velocity: ['25000/P1D'],
      },
    ],
    virtualCardCurrencies: ['USD'],
    bankAccountFundingSourceExpendableEnabled: false,
    fundingSourceClientConfiguration: {
      data: Base64.encodeString(
        JSON.stringify({
          fundingSourceTypes: [
            {
              type: 'stripe',
              fundingSourceType: FundingSourceType.CreditCard,
              version: 1,
              apiKey: 'dummyApiKey',
            },
          ],
        }),
      ),
    },
    clientApplicationsConfiguration: {
      data: Base64.encodeString(
        JSON.stringify({
          webApplication: {
            funding_source_providers: {
              plaid: {
                client_name: 'dummyClientName',
                redirect_uri: 'dummyRedirectUri',
              },
            },
          },
        }),
      ),
    },
    pricingPolicy: {
      data: Base64.encodeString(
        JSON.stringify({
          stripe: {
            creditCard: {
              DEFAULT: {
                tiers: [
                  {
                    minThreshold: 0,
                    markup: {
                      flat: 1000,
                      percent: 10,
                    },
                  },
                ],
              },
            },
          },
        }),
      ),
    },
  }
}
