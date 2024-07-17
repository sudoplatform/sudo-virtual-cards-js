/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Base64,
  DefaultLogger,
  FatalError,
  KeyNotFoundError,
  Logger,
  SignatureAlgorithm,
} from '@sudoplatform/sudo-common'
import { FetchResult } from 'apollo-link'
import { isLeft } from 'fp-ts/lib/Either'
import { PathReporter } from 'io-ts/lib/PathReporter'
import {
  FundingSource,
  OnFundingSourceUpdateSubscription,
} from '../../../gen/graphqlTypes'
import {
  ConnectionState,
  FundingSourceChangeSubscriber,
  FundingSourceType,
  SandboxGetPlaidDataInput,
  SandboxSetFundingSourceToRequireRefreshInput,
} from '../../../public'
import { FundingSourceEntity } from '../../domain/entities/fundingSource/fundingSourceEntity'
import {
  FundingSourceService,
  FundingSourceServiceCancelFundingSourceInput,
  FundingSourceServiceCancelProvisionalFundingSourceInput,
  FundingSourceServiceCompleteFundingSourceInput,
  FundingSourceServiceGetFundingSourceInput,
  FundingSourceServiceListFundingSourcesInput,
  FundingSourceServiceListFundingSourcesOutput,
  FundingSourceServiceListProvisionalFundingSourcesInput,
  FundingSourceServiceListProvisionalFundingSourcesOutput,
  FundingSourceServiceRefreshFundingSourceInput,
  FundingSourceServiceReviewUnfundedFundingSourceInput,
  FundingSourceServiceSetupFundingSourceInput,
  FundingSourceServiceSubscribeToFundingSourceChangesInput,
  FundingSourceServiceUnsubscribeFromFundingSourceChangesInput,
  isFundingSourceServiceCheckoutBankAccountCompletionData,
  isFundingSourceServiceCheckoutBankAccountRefreshData,
  isFundingSourceServiceCheckoutCardCompletionData,
  isFundingSourceServiceStripeCardCompletionData,
} from '../../domain/entities/fundingSource/fundingSourceService'
import { ProvisionalFundingSourceEntity } from '../../domain/entities/fundingSource/provisionalFundingSourceEntity'
import { SandboxPlaidDataEntity } from '../../domain/entities/fundingSource/sandboxPlaidDataEntity'
import { ApiClient } from '../common/apiClient'
import { DeviceKeyWorker, KeyType } from '../common/deviceKeyWorker'
import { SubscriptionManager } from '../common/subscriptionManager'
import { AlgorithmTransformer } from '../common/transformer/algorithmTransformer'
import { FetchPolicyTransformer } from '../common/transformer/fetchPolicyTransformer'
import { decodeBankAccountFundingSourceInstitutionLogo } from '../fundingSourceProviderData/sealedData'
import { FundingSourceUnsealed } from './fundingSourceSealedAttributes'
import { FundingSourceEntityTransformer } from './transformer/fundingSourceEntityTransformer'
import { ProvisionalFundingSourceEntityTransformer } from './transformer/provisionalFundingSourceEntityTransformer'
import { SandboxPlaidDataEntityTransformer } from './transformer/sandboxPlaidDataTransformer'
import { ProvisionalFundingSourceFilterTransformer } from './transformer/provisionalFundingSourceFilterTransformer'

export interface FundingSourceSetup {
  provider: string
}

export class DefaultFundingSourceService implements FundingSourceService {
  private readonly log: Logger

  private readonly subscriptionManager: SubscriptionManager<
    OnFundingSourceUpdateSubscription,
    FundingSourceChangeSubscriber
  >

  constructor(
    private readonly appSync: ApiClient,
    private readonly deviceKeyWorker: DeviceKeyWorker,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
    this.subscriptionManager = new SubscriptionManager<
      OnFundingSourceUpdateSubscription,
      FundingSourceChangeSubscriber
    >()
  }

  async getFundingSourceClientConfiguration(): Promise<string> {
    return (await this.appSync.getFundingSourceClientConfiguration()).data
  }

  public async setupFundingSource({
    currency,
    type,
    supportedProviders,
    setupData,
  }: FundingSourceServiceSetupFundingSourceInput): Promise<ProvisionalFundingSourceEntity> {
    const encodedSetupData = Base64.encodeString(JSON.stringify(setupData))
    const provisionalFundingSource = await this.appSync.setupFundingSource({
      currency,
      type,
      supportedProviders,
      setupData: encodedSetupData,
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

  async refreshFundingSource({
    id,
    refreshData,
    language,
  }: FundingSourceServiceRefreshFundingSourceInput): Promise<FundingSourceEntity> {
    let encodedRefreshData: string
    const provider = refreshData.provider
    const type = refreshData.type ?? FundingSourceType.CreditCard
    if (isFundingSourceServiceCheckoutBankAccountRefreshData(refreshData)) {
      let authorizationTextSignature = undefined
      const publicKey = await this.deviceKeyWorker.getCurrentPublicKey()
      if (!publicKey) {
        throw new KeyNotFoundError()
      }
      if (refreshData.authorizationText) {
        const signedAt = new Date()
        const authorizationTextSignatureData = {
          hash: refreshData.authorizationText.hash,
          hashAlgorithm: refreshData.authorizationText.hashAlgorithm,
          signedAt,
          account: refreshData.accountId,
        }
        const data = JSON.stringify(authorizationTextSignatureData)
        const signature = await this.deviceKeyWorker.signString({
          plainText: data,
          keyId: publicKey.id,
          keyType: KeyType.PrivateKey,
          algorithm: SignatureAlgorithm.RsaPkcs15Sha256,
        })
        authorizationTextSignature = {
          data,
          algorithm: 'RSASignatureSSAPKCS15SHA256',
          keyId: publicKey.id,
          signature,
        }
      }
      encodedRefreshData = Base64.encodeString(
        JSON.stringify({
          provider,
          version: 1,
          type,
          keyId: publicKey.id,
          authorizationTextSignature,
          applicationName: refreshData.applicationName,
        }),
      )
    } else {
      throw new FatalError(`Unexpected provider: ${provider}:${type}`)
    }

    const result = await this.appSync.refreshFundingSource({
      id,
      refreshData: encodedRefreshData,
      language,
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

  async reviewUnfundedFundingSource({
    id,
  }: FundingSourceServiceReviewUnfundedFundingSourceInput): Promise<FundingSourceEntity> {
    const result = await this.appSync.reviewUnfundedFundingSource({ id })
    const unsealed = await this.unsealFundingSource(result)
    return FundingSourceEntityTransformer.transformGraphQL(unsealed)
  }

  async cancelProvisionalFundingSource({
    id,
  }: FundingSourceServiceCancelProvisionalFundingSourceInput): Promise<ProvisionalFundingSourceEntity> {
    const result = await this.appSync.cancelProvisionalFundingSource({ id })
    return ProvisionalFundingSourceEntityTransformer.transformGraphQL(result)
  }

  async listProvisionalFundingSources({
    filterInput,
    cachePolicy,
    limit,
    nextToken,
  }: FundingSourceServiceListProvisionalFundingSourcesInput): Promise<FundingSourceServiceListProvisionalFundingSourcesOutput> {
    const filterInputGraphQL = filterInput
      ? ProvisionalFundingSourceFilterTransformer.transformToGraphQL(
          filterInput,
        )
      : undefined
    const fetchPolicy = cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(cachePolicy)
      : undefined
    const result = await this.appSync.listProvisionalFundingSources(
      fetchPolicy,
      filterInputGraphQL,
      limit,
      nextToken,
    )
    let provisionalFundingSources: ProvisionalFundingSourceEntity[] = []
    if (result.items) {
      provisionalFundingSources = result.items.map((item) =>
        ProvisionalFundingSourceEntityTransformer.transformGraphQL(item),
      )
    }
    return {
      provisionalFundingSources,
      nextToken: result.nextToken ?? undefined,
    }
  }

  subscribeToFundingSourceChanges(
    input: FundingSourceServiceSubscribeToFundingSourceChangesInput,
  ): void {
    this.subscriptionManager.subscribe(input.id, input.subscriber)
    // if subscription manager watcher and subscription hasn't been setup yet
    // create them and watch for funding source changes per `owner`
    if (!this.subscriptionManager.getWatcher()) {
      this.subscriptionManager.setWatcher(
        this.appSync.onFundingSourceUpdate(input.owner),
      )

      this.subscriptionManager.setSubscription(
        this.setupFundingSourceUpdateSubscription(),
      )
      this.subscriptionManager.connectionStatusChanged(
        ConnectionState.Connected,
      )
    }
  }

  unsubscribeFromFundingSourceChanges(
    input: FundingSourceServiceUnsubscribeFromFundingSourceChangesInput,
  ): void {
    this.subscriptionManager.unsubscribe(input.id)
  }

  public async sandboxGetPlaidData(
    input: SandboxGetPlaidDataInput,
  ): Promise<SandboxPlaidDataEntity> {
    const result = await this.appSync.sandboxGetPlaidData({
      input: {
        institutionId: input.institutionId,
        username: input.plaidUsername,
      },
    })
    return SandboxPlaidDataEntityTransformer.transformGraphQL(result)
  }

  public async sandboxSetFundingSourceToRequireRefresh(
    input: SandboxSetFundingSourceToRequireRefreshInput,
  ): Promise<FundingSourceEntity> {
    const result = await this.appSync.sandboxSetFundingSourceToRequireRefresh({
      input,
    })

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

  private setupFundingSourceUpdateSubscription():
    | ZenObservable.Subscription
    | undefined {
    const subscription = this.subscriptionManager.getWatcher()?.subscribe({
      complete: () => {
        this.log.info('completed onFundingSourceUpdate subscription')

        this.subscriptionManager.connectionStatusChanged(
          ConnectionState.Disconnected,
        )
      },
      error: (error) => {
        this.log.info('failed to update onFundingSourceUpdate subscription', {
          error,
        })
        this.subscriptionManager.connectionStatusChanged(
          ConnectionState.Disconnected,
        )
      },
      next: (result: FetchResult<OnFundingSourceUpdateSubscription>) => {
        return void (async (
          result: FetchResult<OnFundingSourceUpdateSubscription>,
        ): Promise<void> => {
          this.log.info('executing onFundingSourceUpdate subscription', {
            result,
          })
          if (result.data) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const data = result.data.onFundingSourceUpdate
            if (!data) {
              throw new FatalError(
                'onFundingSourceUpdate subscription response contained error',
              )
            } else {
              this.log.info('onFundingSourceUpdate subscription successful', {
                data,
              })

              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              const unsealed = await this.unsealFundingSource(data)
              await this.subscriptionManager.fundingSourceChanged(
                FundingSourceEntityTransformer.transformGraphQL(unsealed),
              )
            }
          }
        })(result)
      },
    })
    return subscription
  }
}
