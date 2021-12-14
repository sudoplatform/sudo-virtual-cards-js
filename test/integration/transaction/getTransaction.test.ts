import {
  DefaultLogger,
  ListOperationResultStatus,
} from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import { SudoVirtualCardsSimulatorClient } from '@sudoplatform/sudo-virtual-cards-simulator'
import Stripe from 'stripe'
import { v4 } from 'uuid'
import { SudoVirtualCardsClient, Transaction, VirtualCard } from '../../../src'
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
    const transactionResult = await instanceUnderTest.listTransactionsByCardId({
      cardId: card.id,
    })
    if (transactionResult.status !== ListOperationResultStatus.Success) {
      fail('failed to get successful transactions')
    }
    transaction = transactionResult.items[0]
  })

  describe('getTransaction', () => {
    it('returns expected result', async () => {
      const result = await instanceUnderTest.getTransaction({
        id: transaction.id,
      })
      if (!result) {
        fail('result is undefined')
      }
      expect(result).toStrictEqual(transaction)
    })
    it('returns undefined for non-existent transaction', async () => {
      await expect(
        instanceUnderTest.getTransaction({ id: v4() }),
      ).resolves.toBeUndefined()
    })
  })
})
