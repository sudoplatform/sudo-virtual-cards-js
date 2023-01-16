/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Base64,
  DefaultLogger,
  FatalError,
  KeyNotFoundError,
  Logger,
  SignatureAlgorithm,
} from '@sudoplatform/sudo-common'
import { isLeft } from 'fp-ts/lib/Either'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { FundingSource } from '../../../gen/graphqlTypes'
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
import { AlgorithmTransformer } from '../common/transformer/algorithmTransformer'
import { FetchPolicyTransformer } from '../common/transformer/fetchPolicyTransformer'
import { decodeBankAccountFundingSourceInstitutionLogo } from '../fundingSourceProviderData/sealedData'
import { FundingSourceUnsealed } from './fundingSourceSealedAttributes'
import { FundingSourceEntityTransformer } from './transformer/fundingSourceEntityTransformer'
import { ProvisionalFundingSourceEntityTransformer } from './transformer/provisionalFundingSourceEntityTransformer'

export interface FundingSourceSetup {
  provider: string
}

export class DefaultFundingSourceService implements FundingSourceService {
  private readonly log: Logger

  constructor(
    private readonly appSync: ApiClient,
    private readonly deviceKeyWorker: DeviceKeyWorker,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

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
          keyId: publicKey.id,
          public_token: completionData.publicToken,
          account_id: completionData.accountId,
          institution_id: completionData.institutionId,
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

    const unsealed = await this.unsealFundingSource(result)
    return FundingSourceEntityTransformer.transformGraphQL(unsealed)
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

    const unsealed = await this.unsealFundingSource(result)
    return FundingSourceEntityTransformer.transformGraphQL(unsealed)
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
    let fundingSources: FundingSourceEntity[] = []
    if (result.items) {
      const unsealed = await Promise.all(
        result.items.map((item) => this.unsealFundingSource(item)),
      )
      fundingSources = unsealed.map((item) =>
        FundingSourceEntityTransformer.transformGraphQL(item),
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
    const unsealed = await this.unsealFundingSource(result)
    return FundingSourceEntityTransformer.transformGraphQL(unsealed)
  }

  private async unsealFundingSource(
    sealed: FundingSource,
  ): Promise<FundingSourceUnsealed> {
    if (sealed.__typename === 'CreditCardFundingSource') {
      return sealed
    }

    if (sealed.__typename === 'BankAccountFundingSource') {
      if (sealed.institutionName.plainTextType !== 'string') {
        const msg = `institutionName plain text type '${sealed.institutionName.plainTextType}' is invalid`
        this.log.error(msg, { sealed: JSON.stringify(sealed) })
        throw new FatalError(msg)
      }
      if (
        sealed.institutionLogo &&
        sealed.institutionLogo.plainTextType !== 'json-string'
      ) {
        const msg = `institutionLogo plain text type '${sealed.institutionLogo.plainTextType}' is invalid`
        this.log.error(msg, { sealed: JSON.stringify(sealed) })
        throw new FatalError(msg)
      }

      const institutionNamePromise = this.deviceKeyWorker.unsealString({
        keyId: sealed.institutionName.keyId,
        keyType: KeyType.PrivateKey,
        encrypted: sealed.institutionName.base64EncodedSealedData,
        algorithm: AlgorithmTransformer.toEncryptionAlgorithm(
          KeyType.PrivateKey,
          sealed.institutionName.algorithm,
        ),
      })
      const institutionLogoPromise = sealed.institutionLogo
        ? this.deviceKeyWorker.unsealString({
            keyId: sealed.institutionLogo.keyId,
            keyType: KeyType.PrivateKey,
            encrypted: sealed.institutionLogo.base64EncodedSealedData,
            algorithm: AlgorithmTransformer.toEncryptionAlgorithm(
              KeyType.PrivateKey,
              sealed.institutionLogo.algorithm,
            ),
          })
        : Promise.resolve(undefined)
      const [institutionName, institutionLogo] = await Promise.all([
        institutionNamePromise,
        institutionLogoPromise,
      ])

      const decodedLogo = institutionLogo
        ? decodeBankAccountFundingSourceInstitutionLogo(institutionLogo)
        : undefined
      if (decodedLogo && isLeft(decodedLogo)) {
        const failures = PathReporter.report(decodedLogo)
        const msg = `institutionLogo could not be decoded`
        this.log.error(msg, {
          sealed: JSON.stringify(sealed),
          failures: failures.join('\n'),
          institutionLogo,
        })
        throw new FatalError(msg)
      }

      return { ...sealed, institutionName, institutionLogo: decodedLogo?.right }
    }

    throw new FatalError('Unable to disambiguate funding source')
  }
}
