import { Base64 } from '@sudoplatform/sudo-common'
import { VirtualCard } from '../../../src'
import { VirtualCardsConfigEntity } from '../../../src/private/domain/entities/configuration/virtualCardsConfigEntity'
import { FundingSourceEntity } from '../../../src/private/domain/entities/fundingSource/fundingSourceEntity'
import { ProvisionalFundingSourceEntity } from '../../../src/private/domain/entities/fundingSource/provisionalFundingSourceEntity'
import {
  CurrencyAmountEntity,
  TransactionEntity,
} from '../../../src/private/domain/entities/transaction/transactionEntity'
import { ProvisionalVirtualCardEntity } from '../../../src/private/domain/entities/virtualCard/provisionalVirtualCardEntity'
import { CardType } from '../../../src/public/typings/config'
import {
  CreditCardNetwork,
  FundingSourceState,
  FundingSourceType,
  ProvisionalFundingSourceState,
} from '../../../src/public/typings/fundingSource'
import { ProvisioningState } from '../../../src/public/typings/provisionalCard'
import { TransactionType } from '../../../src/public/typings/transaction'
import { CardState } from '../../../src/public/typings/virtualCard'

export class EntityDataFactory {
  private static readonly commonProps = {
    owner: 'dummyOwner',
    version: 1,
    createdAt: new Date(1.0),
    updatedAt: new Date(2.0),
  }

  private static readonly provisioningData = Base64.encodeString(
    JSON.stringify({
      version: 1,
      provider: 'stripe',
      client_secret: 'dummyClientSecret',
      intent: 'dummyIntent',
    }),
  )

  static readonly provisionalFundingSource: ProvisionalFundingSourceEntity = {
    ...this.commonProps,
    id: 'dummyFundingSourceId',
    provisioningData: this.provisioningData,
    state: ProvisionalFundingSourceState.Completed,
    type: FundingSourceType.CreditCard,
  }

  static readonly fundingSource: FundingSourceEntity = {
    ...this.commonProps,
    id: 'dummyFundingSourceId',
    currency: 'dummyCurrency',
    last4: 'dummyLast4',
    network: CreditCardNetwork.Visa,
    state: FundingSourceState.Active,
    type: FundingSourceType.CreditCard,
  }

  static readonly provisionalVirtualCard: ProvisionalVirtualCardEntity = {
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

  private static readonly virtualCardAmount: CurrencyAmountEntity = {
    currency: 'USD',
    amount: 100,
  }

  private static readonly fundingSourceAmount: CurrencyAmountEntity = {
    currency: 'USD',
    amount: 123,
  }

  static readonly transaction: TransactionEntity = {
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

  static readonly settledTransaction: TransactionEntity = {
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

  static readonly configurationData: VirtualCardsConfigEntity = {
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
  }
}
