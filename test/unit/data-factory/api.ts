import {
  CardState,
  CreditCardNetwork,
  CurrencyAmount,
  DeclineReason,
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
    id: 'dummyId',
    owner: 'dummyOwner',
    version: 1,
    createdAt: new Date(1.0),
    updatedAt: new Date(2.0),
  }
  static readonly provisionalFundingSource: ProvisionalFundingSource = {
    ...this.commonProps,
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
    currency: 'dummyCurrency',
    last4: 'dummyLast4',
    network: CreditCardNetwork.Visa,
    state: FundingSourceState.Active,
  }

  static readonly provisionalVirtualCard: ProvisionalVirtualCard = {
    ...this.commonProps,
    clientRefId: 'dummyClientRefId',
    provisioningState: ProvisioningState.Provisioning,
    card: undefined,
  }
  static readonly virtualCard: VirtualCard = {
    ...this.commonProps,
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

  private static readonly currencyAmount: CurrencyAmount = {
    currency: 'USD',
    amount: 100,
  }

  static readonly transaction: Transaction = {
    ...this.commonProps,
    transactedAt: new Date(100.0),
    cardId: 'dummyCardId',
    sequenceId: 'dummySequenceId',
    type: TransactionType.Complete,
    billedAmount: this.currencyAmount,
    transactedAmount: this.currencyAmount,
    description: 'dummyDescription',
    declineReason: DeclineReason.Declined,
    detail: [
      {
        virtualCardAmount: this.currencyAmount,
        markup: {
          percent: 100,
          flat: 100,
          minCharge: 100,
        },
        markupAmount: this.currencyAmount,
        fundingSourceAmount: this.currencyAmount,
        fundingSourceId: 'dummyFundingSourceId',
        description: 'dummyDescription',
      },
    ],
  }
}
