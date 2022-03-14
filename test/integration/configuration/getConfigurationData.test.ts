import { DefaultLogger } from '@sudoplatform/sudo-common'
import {
  CardType,
  CurrencyAmount,
  CurrencyVelocity,
  SudoVirtualCardsClient,
  VirtualCardsConfig,
} from '../../../src'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient GetConfigurationData Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')

  let instanceUnderTest: SudoVirtualCardsClient

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
  })

  describe('GetConfigurationData', () => {
    const expectedMaxCardCreationVelocity = ['10/PT1H']

    const expectedMaxTransactionAmount: CurrencyAmount[] = [
      {
        currency: 'USD',
        amount: 25000,
      },
    ]

    const expectedMaxTransactionVelocity: CurrencyVelocity[] = [
      {
        currency: 'USD',
        velocity: ['25000/P1D'],
      },
    ]

    const expectedVirtualCardCurrencies = ['USD']

    const expectedFundingSourceSupportInfo = [
      {
        __typename: 'FundingSourceSupportInfo',
        detail: [
          {
            __typename: 'FundingSourceSupportDetail',
            cardType: CardType.Credit,
          },
        ],
        fundingSourceType: 'card',
        network: 'AMEX',
        providerType: 'stripe',
      },
      {
        __typename: 'FundingSourceSupportInfo',
        detail: [
          {
            __typename: 'FundingSourceSupportDetail',
            cardType: CardType.Credit,
          },
        ],
        fundingSourceType: 'card',
        network: 'DINERS',
        providerType: 'stripe',
      },
      {
        __typename: 'FundingSourceSupportInfo',
        detail: [
          {
            __typename: 'FundingSourceSupportDetail',
            cardType: CardType.Credit,
          },
          {
            __typename: 'FundingSourceSupportDetail',
            cardType: CardType.Debit,
          },
        ],
        fundingSourceType: 'card',
        network: 'MASTERCARD',
        providerType: 'stripe',
      },
      {
        __typename: 'FundingSourceSupportInfo',
        detail: [
          {
            __typename: 'FundingSourceSupportDetail',
            cardType: CardType.Credit,
          },
          {
            __typename: 'FundingSourceSupportDetail',
            cardType: CardType.Debit,
          },
        ],
        fundingSourceType: 'card',
        network: 'VISA',
        providerType: 'stripe',
      },
      {
        __typename: 'FundingSourceSupportInfo',
        detail: [
          {
            __typename: 'FundingSourceSupportDetail',
            cardType: CardType.Credit,
          },
        ],
        fundingSourceType: 'card',
        network: 'DISCOVER',
        providerType: 'stripe',
      },
    ]

    it('returns expected result', async () => {
      const expectedResult: VirtualCardsConfig = {
        maxCardCreationVelocity: expectedMaxCardCreationVelocity,
        maxFundingSourceFailureVelocity: [],
        maxFundingSourceVelocity: [],
        maxTransactionAmount: expectedMaxTransactionAmount,
        maxTransactionVelocity: expectedMaxTransactionVelocity,
        virtualCardCurrencies: expectedVirtualCardCurrencies,
        fundingSourceSupportInfo: expectedFundingSourceSupportInfo,
      }

      await expect(instanceUnderTest.getVirtualCardsConfig()).resolves.toEqual(
        expectedResult,
      )
    })
  })
})
