import {
  CardState,
  CreditCardNetwork,
  CurrencyAmount,
  FundingSource,
  FundingSourceState,
  ProvisionalFundingSource,
  ProvisionalFundingSourceState,
  ProvisionalVirtualCard,
  ProvisioningState,
  StateReason,
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
    provisioningData: {
      version: 1,
      provider: 'stripe',
      clientSecret: 'dummyClientSecret',
      intent: 'dummyIntent',
    },
    state: ProvisionalFundingSourceState.Completed,
    stateReason: StateReason.Unlocked,
  }

  static readonly fundingSource: FundingSource = {
    ...this.commonProps,
    id: 'dummyFundingSourceId',
    currency: 'dummyCurrency',
    last4: 'dummyLast4',
    network: CreditCardNetwork.Visa,
    state: FundingSourceState.Active,
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
}
