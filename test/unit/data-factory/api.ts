import {
  BankAccountType,
  CardState,
  CardType,
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

  static readonly creditCardFundingSource: FundingSource = {
    ...this.commonProps,
    id: 'dummyFundingSourceId',
    currency: 'dummyCurrency',
    last4: 'dummyLast4',
    network: CreditCardNetwork.Visa,
    state: FundingSourceState.Active,
    type: FundingSourceType.CreditCard,
    cardType: CardType.Credit,
  }

  static readonly defaultFundingSource = this.creditCardFundingSource

  static readonly bankAccountFundingSource: FundingSource = {
    ...this.commonProps,
    id: 'dummyFundingSourceId',
    currency: 'dummyCurrency',
    state: FundingSourceState.Active,
    type: FundingSourceType.BankAccount,
    bankAccountType: BankAccountType.Savings,
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
      },
    ],
  }
}
