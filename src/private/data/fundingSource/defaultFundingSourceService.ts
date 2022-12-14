/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Base64,
  FatalError,
  KeyNotFoundError,
  SignatureAlgorithm,
} from '@sudoplatform/sudo-common'
import { FundingSourceType } from '../../../public'
import { FundingSourceEntity } from '../../domain/entities/fundingSource/fundingSourceEntity'
import {
  FundingSourceService,
  FundingSourceServiceCancelFundingSourceInput,
  FundingSourceServiceCompleteFundingSourceInput,
  FundingSourceServiceGetFundingSourceInput,
  FundingSourceServiceListFundingSourcesInput,
  FundingSourceServiceListFundingSourcesOutput,
  FundingSourceServiceSetupFundingSourceInput,
  isFundingSourceServiceCheckoutBankAccountCompletionData,
  isFundingSourceServiceCheckoutCardCompletionData,
  isFundingSourceServiceStripeCardCompletionData,
} from '../../domain/entities/fundingSource/fundingSourceService'
import { ProvisionalFundingSourceEntity } from '../../domain/entities/fundingSource/provisionalFundingSourceEntity'
import { ApiClient } from '../common/apiClient'
import { DeviceKeyWorker, KeyType } from '../common/deviceKeyWorker'
import { FetchPolicyTransformer } from '../common/transformer/fetchPolicyTransformer'
import { FundingSourceEntityTransformer } from './transformer/fundingSourceEntityTransformer'
import { ProvisionalFundingSourceEntityTransformer } from './transformer/provisionalFundingSourceEntityTransformer'

export interface FundingSourceSetup {
  provider: string
}

export class DefaultFundingSourceService implements FundingSourceService {
  constructor(
    private readonly appSync: ApiClient,
    private readonly deviceKeyWorker: DeviceKeyWorker,
  ) {}

  async getFundingSourceClientConfiguration(): Promise<string> {
    return (await this.appSync.getFundingSourceClientConfiguration()).data
  }

  public async setupFundingSource({
    currency,
    type,
    supportedProviders,
  }: FundingSourceServiceSetupFundingSourceInput): Promise<ProvisionalFundingSourceEntity> {
    const provisionalFundingSource = await this.appSync.setupFundingSource({
      currency,
      type,
      supportedProviders,
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
    let encodedCompletionData: string
    const provider = completionData.provider
    const type = completionData.type ?? FundingSourceType.CreditCard
    if (isFundingSourceServiceStripeCardCompletionData(completionData)) {
      encodedCompletionData = Base64.encodeString(
        JSON.stringify({
          provider,
          version: 1,
          type,
          payment_method: completionData.paymentMethod,
        }),
      )
    } else if (
      isFundingSourceServiceCheckoutCardCompletionData(completionData)
    ) {
      encodedCompletionData = Base64.encodeString(
        JSON.stringify({
          provider,
          version: 1,
          type,
          payment_token: completionData.paymentToken,
        }),
      )
    } else if (
      isFundingSourceServiceCheckoutBankAccountCompletionData(completionData)
    ) {
      const publicKey = await this.deviceKeyWorker.getCurrentPublicKey()
      if (!publicKey) {
        throw new KeyNotFoundError()
      }

      const signedAt = new Date()
      const authorizationTextSignatureData = {
        hash: completionData.authorizationText.hash,
        hashAlgorithm: completionData.authorizationText.hashAlgorithm,
        signedAt,
        account: completionData.accountId,
      }
      const data = JSON.stringify(authorizationTextSignatureData)
      const signature = await this.deviceKeyWorker.signString({
        plainText: data,
        keyId: publicKey.id,
        keyType: KeyType.PrivateKey,
        algorithm: SignatureAlgorithm.RsaPkcs15Sha256,
      })
      const authorizationTextSignature = {
        data,
        algorithm: 'RSASignatureSSAPKCS15SHA256',
        keyId: publicKey.id,
        signature,
      }

      encodedCompletionData = Base64.encodeString(
        JSON.stringify({
          provider,
          version: 1,
          type,
          public_token: completionData.publicToken,
          account_id: completionData.accountId,
          authorizationTextSignature,
        }),
      )
    } else {
      throw new FatalError(`Unexpected provider: ${provider}:${type}`)
    }

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
