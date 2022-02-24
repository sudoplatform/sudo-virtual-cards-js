/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Base64 } from '@sudoplatform/sudo-common'
import { FundingSourceEntity } from '../../domain/entities/fundingSource/fundingSourceEntity'
import {
  FundingSourceService,
  FundingSourceServiceCancelFundingSourceInput,
  FundingSourceServiceCompleteFundingSourceInput,
  FundingSourceServiceGetFundingSourceInput,
  FundingSourceServiceListFundingSourcesInput,
  FundingSourceServiceListFundingSourcesOutput,
  FundingSourceServiceSetupFundingSourceInput,
} from '../../domain/entities/fundingSource/fundingSourceService'
import { ProvisionalFundingSourceEntity } from '../../domain/entities/fundingSource/provisionalFundingSourceEntity'
import { ApiClient } from '../common/apiClient'
import { FetchPolicyTransformer } from '../common/transformer/fetchPolicyTransformer'
import { FundingSourceEntityTransformer } from './transformer/fundingSourceEntityTransformer'
import { ProvisionalFundingSourceEntityTransformer } from './transformer/provisionalFundingSourceEntityTransformer'

export interface FundingSourceSetup {
  provider: string
}

export class DefaultFundingSourceService implements FundingSourceService {
  constructor(private readonly appSync: ApiClient) {}

  async getFundingSourceClientConfiguration(): Promise<string> {
    return (await this.appSync.getFundingSourceClientConfiguration()).data
  }

  public async setupFundingSource({
    currency,
    type,
  }: FundingSourceServiceSetupFundingSourceInput): Promise<ProvisionalFundingSourceEntity> {
    const provisionalFundingSource = await this.appSync.setupFundingSource({
      currency,
      type,
    })
    return ProvisionalFundingSourceEntityTransformer.transformGraphQL(
      provisionalFundingSource,
    )
  }

  async completeFundingSource({
    id,
    completionData,
    updateCardFundingSource,
  }: FundingSourceServiceCompleteFundingSourceInput): Promise<FundingSourceEntity> {
    const encodedCompletionData = Base64.encodeString(
      JSON.stringify({
        provider: completionData.provider,
        version: completionData.version,
        payment_method: completionData.paymentMethod,
      }),
    )
    const result = await this.appSync.completeFundingSource({
      id,
      completionData: encodedCompletionData,
      updateCardFundingSource,
    })
    return FundingSourceEntityTransformer.transformGraphQL(result)
  }

  async getFundingSource(
    input: FundingSourceServiceGetFundingSourceInput,
  ): Promise<FundingSourceEntity | undefined> {
    const fetchPolicy = input.cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(input.cachePolicy)
      : undefined
    const result = await this.appSync.getFundingSource(input.id, fetchPolicy)
    if (!result) {
      return undefined
    }
    return FundingSourceEntityTransformer.transformGraphQL(result)
  }

  async listFundingSources({
    cachePolicy,
    limit,
    nextToken,
  }: FundingSourceServiceListFundingSourcesInput): Promise<FundingSourceServiceListFundingSourcesOutput> {
    const fetchPolicy = cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(cachePolicy)
      : undefined
    const result = await this.appSync.listFundingSources(
      fetchPolicy,
      limit,
      nextToken,
    )
    const fundingSources: FundingSourceEntity[] = []
    if (result.items) {
      result.items.map((item) =>
        fundingSources.push(
          FundingSourceEntityTransformer.transformGraphQL(item),
        ),
      )
    }
    return {
      fundingSources,
      nextToken: result.nextToken ?? undefined,
    }
  }

  async cancelFundingSource({
    id,
  }: FundingSourceServiceCancelFundingSourceInput): Promise<FundingSourceEntity> {
    const result = await this.appSync.cancelFundingSource({ id })
    return FundingSourceEntityTransformer.transformGraphQL(result)
  }
}
