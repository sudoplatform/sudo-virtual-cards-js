import {
  DefaultLogger,
  ListOperationResultStatus,
} from '@sudoplatform/sudo-common'
import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import { SudoVirtualCardsSimulatorClient } from '@sudoplatform/sudo-virtual-cards-simulator'
import { v4 } from 'uuid'
import waitForExpect from 'wait-for-expect'
import {
  ListTransactionsResults,
  SudoVirtualCardsClient,
  Transaction,
  VirtualCard,
} from '../../../src'
import { ProviderAPIs } from '../util/getProviderAPIs'
import { provisionVirtualCard } from '../util/provisionVirtualCard'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('GetTransaction Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let vcSimulator: SudoVirtualCardsSimulatorClient
  let profilesClient: SudoProfilesClient
  let apis: ProviderAPIs

  let sudo: Sudo
  let card: VirtualCard

  let authorization: Transaction

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    profilesClient = result.profilesClient
    sudo = result.sudo
    apis = result.apis
    vcSimulator = result.virtualCardsSimulatorClient

    card = await provisionVirtualCard(
      instanceUnderTest,
      profilesClient,
      sudo,
      apis,
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

    let authorizationResult: ListTransactionsResults | undefined
    await waitForExpect(async () => {
      authorizationResult = await instanceUnderTest.listTransactionsByCardId({
        cardId: card.id,
      })
      if (authorizationResult.status !== ListOperationResultStatus.Success) {
        fail('failed to get successful transactions')
      }
      expect(authorizationResult.items).toHaveLength(1)
    })

    if (authorizationResult?.status !== ListOperationResultStatus.Success) {
      fail('transaction result unexpectedly falsy')
    }
    authorization = authorizationResult.items[0]
  })

  describe('getTransaction', () => {
    it('returns expected result for an authorization', async () => {
      const result = await instanceUnderTest.getTransaction({
        id: authorization.id,
      })
      expect(result).toStrictEqual(authorization)
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
