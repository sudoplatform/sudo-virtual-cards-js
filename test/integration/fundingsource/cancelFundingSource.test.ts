import { DefaultLogger } from '@sudoplatform/sudo-common'
import Stripe from 'stripe'
import {
  FundingSourceNotFoundError,
  FundingSourceState,
  SudoVirtualCardsClient,
} from '../../../src'
import { createFundingSource } from '../util/createFundingSource'
import { setupVirtualCardsClient } from '../util/virtualCardsClientLifecycle'

describe('SudoVirtualCardsClient CancelFundingSource Test Suite', () => {
  jest.setTimeout(240000)
  const log = new DefaultLogger('SudoVirtualCardsClientIntegrationTests')
  let instanceUnderTest: SudoVirtualCardsClient
  let stripe: Stripe

  beforeEach(async () => {
    const result = await setupVirtualCardsClient(log)
    instanceUnderTest = result.virtualCardsClient
    stripe = result.stripe
  })

  describe('CancelFundingSource', () => {
    it('returns expected inactive funding source output', async () => {
      const fundingSource = await createFundingSource(instanceUnderTest, stripe)
      expect(fundingSource.state).toEqual(FundingSourceState.Active)

      const result = await instanceUnderTest.cancelFundingSource(
        fundingSource.id,
      )
      expect(result.id).toEqual(fundingSource.id)
      expect(result.state).toEqual(FundingSourceState.Inactive)
    })

    it('throws a FundingSourceNotFound error when non-existent funding source is attempted to be cancelled', async () => {
      await expect(
        instanceUnderTest.cancelFundingSource('non-existent-id'),
      ).rejects.toThrow(FundingSourceNotFoundError)
    })
  })
})
