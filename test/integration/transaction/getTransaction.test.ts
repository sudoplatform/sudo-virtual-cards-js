import {
  DefaultLogger,
  ListOperationResultStatus,
} from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import { SudoVirtualCardsSimulatorClient } from '@sudoplatform/sudo-virtual-cards-simulator'
import Stripe from 'stripe'
import { v4 } from 'uuid'
import waitForExpect from 'wait-for-expect'
import {
  ListTransactionsResults,
  SudoVirtualCardsClient,
  Transaction,
  VirtualCard,
} from '../../../src'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('GetTransaction Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let vcSimulator: SudoVirtualCardsSimulatorClient
  let profilesClient: SudoProfilesClient
  let stripe: Stripe

  let sudo: Sudo
  let card: VirtualCard

  let transaction: Transaction

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    sudo = result.sudo
    stripe = result.stripe
    vcSimulator = result.virtualCardsSimulatorClient

    card = await provisionVirtualCard(
      instanceUnderTest,
      profilesClient,
      sudo,
      stripe,
    )
    const merchant = (await vcSimulator.listSimulatorMerchants())[0]
    await vcSimulator.simulateAuthorization({
      pan: card.pan,
      amount: 50,
      merchantId: merchant.id,
      expiry: card.expiry,
      billingAddress: card.billingAddress,
      csc: card.csc,
    })

    let transactionResult: ListTransactionsResults | undefined
    await waitForExpect(async () => {
      transactionResult = await instanceUnderTest.listTransactionsByCardId({
        cardId: card.id,
      })
      if (transactionResult.status !== ListOperationResultStatus.Success) {
        fail('failed to get successful transactions')
      }
      expect(transactionResult.items).toHaveLength(1)
    })

    if (transactionResult?.status !== ListOperationResultStatus.Success) {
      fail('transaction result unexpectedly falsy')
    }
    transaction = transactionResult.items[0]
  })

  describe('getTransaction', () => {
    it('returns expected result', async () => {
      const result = await instanceUnderTest.getTransaction({
        id: transaction.id,
      })
      expect(result).toStrictEqual(transaction)
    })

    it('returns undefined for non-existent transaction', async () => {
      await expect(
        instanceUnderTest.getTransaction({
          id: v4(),
        }),
      ).resolves.toBeUndefined()
    })
  })
})
