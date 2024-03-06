/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Base64, EncryptionAlgorithm } from '@sudoplatform/sudo-common'
import { BankAccountType } from '../../../src'
import {
  BankAccountFundingSource,
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
import {
  BankAccountFundingSourceUnsealed,
  FundingSourceUnsealed,
} from '../../../src/private/data/fundingSource/fundingSourceSealedAttributes'

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
  private static readonly bankAccountProvisioningData = Base64.encodeString(
    JSON.stringify({
      provider: 'checkout',
      version: 1,
      type: 'BANK_ACCOUNT',
      plaidLinkToken: {
        link_token: 'link_token',
        expiration: 'expiration',
        request_id: 'request_id',
      },
      authorizationText: [
        {
          content: 'authorization-text-0',
          contentType: 'authorization-text-0-content-type',
          language: 'authorization-text-0-language',
          hash: 'authorization-text-0-hash',
          hashAlgorithm: 'authorization-text-0-hash-algorithm',
        },
        {
          content: 'authorization-text-1',
          contentType: 'authorization-text-1-content-type',
          language: 'authorization-text-1-language',
          hash: 'authorization-text-1-hash',
          hashAlgorithm: 'authorization-text-1-hash-algorithm',
        },
      ],
    }),
  )

  static readonly interactionDataErrorInfo = {
    provisioningData: Base64.encodeString(
      JSON.stringify({
        provider: 'checkout',
        version: 1,
        type: 'CREDIT_CARD',
        redirectUrl: 'https://some.com/url',
        successUrl: 'https://some.com/success-url',
        failureUrl: 'https://some.com/failure-url',
      }),
    ),
  }

  static readonly provisionalFundingSource: ProvisionalFundingSource = {
    ...GraphQLDataFactory.commonProps,
    id: 'dummyFundingSourceId',
    state: ProvisionalFundingSourceState.Completed,
    provisioningData: this.provisioningData,
  }

  static readonly provisionalBankAccountFundingSource: ProvisionalFundingSource =
    {
      ...GraphQLDataFactory.commonProps,
      id: 'dummyFundingSourceId',
      state: ProvisionalFundingSourceState.Completed,
      provisioningData: this.bankAccountProvisioningData,
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

  static readonly bankAccountfundingSource: BankAccountFundingSource = {
    ...GraphQLDataFactory.commonFundingSourceUnsealedProps,
    __typename: 'BankAccountFundingSource',
    bankAccountType: BankAccountType.Savings,
    authorization: {
      content: 'dummyAuthorizationContent',
      contentType: 'dummyAuthorizationContentType',
      algorithm: 'dummyAuthorizationAlgorithm',
      signature: 'dummyAuthorizationSignature',
      data: 'dummyAuthorizationData',
      keyId: 'dummyAuthorizationKeyId',
      language: 'dummyAuthorizationLanguage',
    },
    last4: '1234',
    institutionName: {
      algorithm: 'RSAEncryptionOAEPAESCBC',
      plainTextType: 'string',
      keyId: 'dummyKeyId',
      base64EncodedSealedData: 'sealed-dummyInstitutionName',
    },
    institutionLogo: {
      algorithm: 'RSAEncryptionOAEPAESCBC',
      plainTextType: 'json-string',
      keyId: 'dummyKeyId',
      base64EncodedSealedData: 'sealed-dummyInstitutionLogo',
    },
  }

  static readonly fundingSourceConnection: FundingSourceConnection = {
    items: [
      GraphQLDataFactory.creditCardfundingSource,
      GraphQLDataFactory.bankAccountfundingSource,
    ],
    nextToken: undefined,
  }

  static readonly bankAccountFundingSourceUnsealed: BankAccountFundingSourceUnsealed =
    {
      ...GraphQLDataFactory.commonFundingSourceUnsealedProps,
      __typename: 'BankAccountFundingSource',
      bankAccountType: BankAccountType.Savings,
      authorization: {
        content: 'dummyAuthorizationContent',
        contentType: 'dummyAuthorizationContentType',
        algorithm: 'dummyAuthorizationAlgorithm',
        signature: 'dummyAuthorizationSignature',
        data: 'dummyAuthorizationData',
        keyId: 'dummyAuthorizationKeyId',
        language: 'dummyAuthorizationLanguage',
      },
      last4: '1234',
      institutionName: 'dummyInstitutionName',
      institutionLogo: {
        type: 'image/png',
        data: 'dummyInstitutionLogo',
      },
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
    bankAccountFundingSourceExpendableEnabled: true,
    bankAccountFundingSourceCreationEnabled: true,
    fundingSourceClientConfiguration: {
      data: Base64.encodeString(
        JSON.stringify({
          fundingSourceTypes: [
            {
              type: 'checkout',
              fundingSourceType: FundingSourceType.BankAccount,
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
          checkout: {
            creditCard: {
              DEFAULT: {
                tiers: [
                  {
                    minThreshold: 0,
                    markup: {
                      flat: 2500,
                      percent: 25,
                    },
                  },
                ],
              },
            },
            bankAccount: {
              DEFAULT: {
                tiers: [
                  {
                    minThreshold: 0,
                    markup: {
                      flat: 1000,
                      percent: 0,
                    },
                  },
                  {
                    minThreshold: 10000,
                    markup: {
                      flat: 2000,
                      percent: 0,
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
