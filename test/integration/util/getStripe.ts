import Stripe from 'stripe'
import { SudoVirtualCardsClient } from '../../../src'

export const getStripe = async (
  vcClient: SudoVirtualCardsClient,
): Promise<Stripe> => {
  const config = await vcClient.getFundingSourceClientConfiguration()
  const fsConfig = config[0]
  if (!fsConfig) {
    throw 'Invalid config'
  }
  if (fsConfig.type !== 'stripe') {
    throw 'Invalid Stripe config'
  }
  if (fsConfig.version !== 1) {
    throw 'Invalid config version'
  }
  if (!fsConfig.apiKey) {
    throw 'Missing api key'
  }
  return new Stripe(fsConfig.apiKey, {
    apiVersion: '2022-08-01',
    typescript: true,
  })
}
