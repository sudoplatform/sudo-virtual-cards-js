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
  Logger,
} from '@sudoplatform/sudo-common'
import {
  FundingSource,
  OnFundingSourceUpdateSubscription,
} from '../../../gen/graphqlTypes'
import {
  ConnectionState,
  FundingSourceChangeSubscriber,
  FundingSourceType,
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
  FundingSourceServiceSetupFundingSourceInput,
  FundingSourceServiceSubscribeToFundingSourceChangesInput,
  FundingSourceServiceUnsubscribeFromFundingSourceChangesInput,
  isFundingSourceServiceStripeCardCompletionData,
} from '../../domain/entities/fundingSource/fundingSourceService'
import { ProvisionalFundingSourceEntity } from '../../domain/entities/fundingSource/provisionalFundingSourceEntity'
import { ApiClient } from '../common/apiClient'
import { DeviceKeyWorker } from '../common/deviceKeyWorker'
import {
  SubscriptionManager,
  SubscriptionResult,
} from '../common/subscriptionManager'
import { FundingSourceUnsealed } from './fundingSourceSealedAttributes'
import { FundingSourceEntityTransformer } from './transformer/fundingSourceEntityTransformer'
import { ProvisionalFundingSourceEntityTransformer } from './transformer/provisionalFundingSourceEntityTransformer'
import { ProvisionalFundingSourceFilterTransformer } from './transformer/provisionalFundingSourceFilterTransformer'
import { SortOrderTransformer } from '../common/transformer/sortOrderTransformer'
import { FundingSourceFilterTransformer } from './transformer/fundingSourceFilterTransformer'

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
    const result = await this.appSync.getFundingSource(input.id)
    if (!result) {
      return undefined
    }

    const unsealed = await this.unsealFundingSource(result)
    return FundingSourceEntityTransformer.transformGraphQL(unsealed)
  }

  async listFundingSources({
    filterInput,
    sortOrder,
    limit,
    nextToken,
  }: FundingSourceServiceListFundingSourcesInput): Promise<FundingSourceServiceListFundingSourcesOutput> {
    const filterInputGraphQL = filterInput
      ? FundingSourceFilterTransformer.transformToGraphQL(filterInput)
      : undefined
    const sortOrderGraphQL = sortOrder
      ? SortOrderTransformer.transformToGraphQL(sortOrder)
      : undefined
    const result = await this.appSync.listFundingSources(
      filterInputGraphQL,
      sortOrderGraphQL,
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

  async cancelProvisionalFundingSource({
    id,
  }: FundingSourceServiceCancelProvisionalFundingSourceInput): Promise<ProvisionalFundingSourceEntity> {
    const result = await this.appSync.cancelProvisionalFundingSource({ id })
    return ProvisionalFundingSourceEntityTransformer.transformGraphQL(result)
  }

  async listProvisionalFundingSources({
    filterInput,
    sortOrder,
    limit,
    nextToken,
  }: FundingSourceServiceListProvisionalFundingSourcesInput): Promise<FundingSourceServiceListProvisionalFundingSourcesOutput> {
    const filterInputGraphQL = filterInput
      ? ProvisionalFundingSourceFilterTransformer.transformToGraphQL(
          filterInput,
        )
      : undefined
    const sortOrderGraphQL = sortOrder
      ? SortOrderTransformer.transformToGraphQL(sortOrder)
      : undefined
    const result = await this.appSync.listProvisionalFundingSources(
      filterInputGraphQL,
      sortOrderGraphQL,
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

  async subscribeToFundingSourceChanges(
    input: FundingSourceServiceSubscribeToFundingSourceChangesInput,
  ): Promise<void> {
    this.subscriptionManager.subscribe(input.id, input.subscriber)
    // if subscription manager watcher and subscription hasn't been setup yet
    // create them and watch for funding source changes per `owner`
    if (!this.subscriptionManager.getWatcher()) {
      const watcher = await this.appSync.onFundingSourceUpdate(input.owner)
      this.subscriptionManager.setWatcher(watcher)

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

  private unsealFundingSource(
    sealed: FundingSource,
  ): Promise<FundingSourceUnsealed> {
    if (sealed.__typename === 'CreditCardFundingSource') {
      return Promise.resolve(sealed)
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
      next: (result: SubscriptionResult<OnFundingSourceUpdateSubscription>) => {
        return void (async (
          result: SubscriptionResult<OnFundingSourceUpdateSubscription>,
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
