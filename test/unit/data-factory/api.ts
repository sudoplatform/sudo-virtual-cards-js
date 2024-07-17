/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BankAccountType,
  CardState,
  CardType,
  ChargeDetailState,
  CreditCardNetwork,
  CurrencyAmount,
  FundingSource,
  FundingSourceState,
  FundingSourceType,
  ProvisionalFundingSource,
  ProvisionalFundingSourceState,
  ProvisionalVirtualCard,
  ProvisioningState,
  Transaction,
  TransactionType,
  VirtualCard,
} from '../../../src'
import { VirtualCardsConfig } from '../../../src/public/typings/virtualCardsConfig'

export class ApiDataFactory {
  private static readonly commonProps = {
    owner: 'dummyOwner',
    version: 1,
    createdAt: new Date(1.0),
    updatedAt: new Date(2.0),
  }
  static readonly provisionalFundingSource: ProvisionalFundingSource = {
    ...this.commonProps,
    id: 'dummyFundingSourceId',
    type: FundingSourceType.CreditCard,
    last4: '1234',
    provisioningData: {
      version: 1,
      provider: 'stripe',
      type: FundingSourceType.CreditCard,
      clientSecret: 'dummyClientSecret',
      intent: 'dummyIntent',
    },
    state: ProvisionalFundingSourceState.Completed,
  }

  static readonly provisionalBankAccountFundingSource: ProvisionalFundingSource =
    {
      ...this.commonProps,
      id: 'dummyFundingSourceId',
      type: FundingSourceType.BankAccount,
      last4: '1234',
      provisioningData: {
        version: 1,
        provider: 'checkout',
        type: FundingSourceType.BankAccount,
        linkToken: 'link_token',
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
      },
      state: ProvisionalFundingSourceState.Completed,
    }

  private static readonly commonFundingSourceProps = {
    ...this.commonProps,
    id: 'dummyFundingSourceId',
    currency: 'dummyCurrency',
    state: FundingSourceState.Active,
    flags: [],
    transactionVelocity: {
      maximum: 10000,
      velocity: ['10000/P1D'],
    },
  }
  static readonly creditCardFundingSource: FundingSource = {
    ...this.commonFundingSourceProps,
    type: FundingSourceType.CreditCard,
    last4: 'dummyLast4',
    network: CreditCardNetwork.Visa,
    cardType: CardType.Credit,
  }

  static readonly defaultFundingSource = this.creditCardFundingSource

  static readonly bankAccountFundingSource: FundingSource = {
    ...this.commonFundingSourceProps,
    type: FundingSourceType.BankAccount,
    bankAccountType: BankAccountType.Savings,
    last4: '1234',
    institutionName: 'dummyInstitutionName',
    institutionLogo: {
      type: 'image/png',
      data: 'dummyInstitutionLogo',
    },
  }

  static readonly provisionalVirtualCard: ProvisionalVirtualCard = {
    ...this.commonProps,
    id: 'dummyVirtualCardId',
    clientRefId: 'dummyClientRefId',
    provisioningState: ProvisioningState.Provisioning,
    card: undefined,
  }
  static readonly virtualCard: VirtualCard = {
    ...this.commonProps,
    id: 'dummyVirtualCardId',
    owners: [
      {
        id: 'dummyOwnerId',
        issuer: 'dummyIssuer',
      },
    ],
    fundingSourceId: 'dummyFundingSourceId',
    currency: 'dummyCurrency',
    state: CardState.Issued,
    activeTo: new Date(3.0),
    cancelledAt: undefined,
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

  private static readonly virtualCardAmount: CurrencyAmount = {
    currency: 'USD',
    amount: 100,
  }

  private static readonly fundingSourceAmount: CurrencyAmount = {
    currency: 'USD',
    amount: 123,
  }

  static readonly transaction: Transaction = {
    ...this.commonProps,
    id: 'dummyTransactionId',
    transactedAt: new Date(100.0),
    cardId: 'dummyVirtualCardId',
    sequenceId: 'dummySequenceId',
    type: TransactionType.Pending,
    billedAmount: this.virtualCardAmount,
    transactedAmount: this.virtualCardAmount,
    description: 'dummyDescription',
    detail: [
      {
        virtualCardAmount: this.virtualCardAmount,
        markup: {
          percent: 299,
          flat: 31,
          minCharge: 50,
        },
        markupAmount: {
          currency: 'USD',
          amount:
            this.fundingSourceAmount.amount - this.virtualCardAmount.amount,
        },
        fundingSourceAmount: this.fundingSourceAmount,
        fundingSourceId: 'dummyFundingSourceId',
        description: 'dummyFundingSourceDescription',
        state: ChargeDetailState.Cleared,
        continuationOfExistingCharge: false,
      },
    ],
  }
  static readonly settledTransaction: Transaction = {
    ...this.commonProps,
    id: 'dummyTransactionId',
    transactedAt: new Date(100.0),
    settledAt: new Date(120.0),
    cardId: 'dummyVirtualCardId',
    sequenceId: 'dummySequenceId',
    type: TransactionType.Complete,
    billedAmount: this.virtualCardAmount,
    transactedAmount: this.virtualCardAmount,
    description: 'dummyDescription',
    detail: [
      {
        virtualCardAmount: this.virtualCardAmount,
        markup: {
          percent: 299,
          flat: 31,
          minCharge: 50,
        },
        markupAmount: {
          currency: 'USD',
          amount:
            this.fundingSourceAmount.amount - this.virtualCardAmount.amount,
        },
        fundingSourceAmount: this.fundingSourceAmount,
        fundingSourceId: 'dummyFundingSourceId',
        description: 'dummyFundingSourceDescription',
        state: ChargeDetailState.Cleared,
        continuationOfExistingCharge: false,
      },
    ],
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
    bankAccountFundingSourceExpendableEnabled: true,
    bankAccountFundingSourceCreationEnabled: true,
    fundingSourceClientConfiguration: [
      {
        type: 'checkout',
        fundingSourceType: FundingSourceType.BankAccount,
        version: 1,
        apiKey: 'dummyApiKey',
      },
    ],
    clientApplicationConfiguration: {
      webApplication: {
        funding_source_providers: {
          plaid: {
            client_name: 'dummyClientName',
            redirect_uri: 'dummyRedirectUri',
          },
        },
      },
    },
    pricingPolicy: {
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
    },
  }
}
