/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger, Logger } from '@sudoplatform/sudo-common'
import { Observable } from 'apollo-client/util/Observable'
import { FetchResult } from 'apollo-link'
import { OnFundingSourceUpdateSubscription } from '../../../gen/graphqlTypes'
import {
  ConnectionState,
  FundingSource,
  FundingSourceChangeSubscriber,
} from '../../../public'

export type Subscribable = OnFundingSourceUpdateSubscription
export class SubscriptionManager<
  T extends Subscribable,
  S extends FundingSourceChangeSubscriber,
> implements FundingSourceChangeSubscriber
{
  private readonly log: Logger
  private subscribers: Record<string, S | undefined> = {}

  private _subscription: ZenObservable.Subscription | undefined = undefined

  private _watcher: Observable<FetchResult<T>> | undefined = undefined

  public constructor() {
    this.log = new DefaultLogger(this.constructor.name)
  }

  public subscribe(id: string, subscriber: S): void {
    this.subscribers[id] = subscriber
  }

  public unsubscribe(id: string): void {
    this.subscribers[id] = undefined
  }

  public getWatcher(): Observable<FetchResult<T>> | undefined {
    return this._watcher
  }

  public setWatcher(
    value: Observable<FetchResult<T>> | undefined,
  ): SubscriptionManager<T, S> {
    this._watcher = value
    return this
  }

  public setSubscription(
    value: ZenObservable.Subscription | undefined,
  ): SubscriptionManager<T, S> {
    this._subscription = value
    return this
  }

  /**
   * Processes AppSync subscription connection status change.
   *
   * @param state connection state.
   */
  public connectionStatusChanged(state: ConnectionState): void {
    const subscribersToNotify = Object.values(this.subscribers)

    if (state == ConnectionState.Disconnected) {
      this.subscribers = {}
      this._subscription?.unsubscribe()
      this._watcher = undefined
      this._subscription = undefined
    }

    subscribersToNotify.forEach((subscriber) => {
      if (subscriber && subscriber.connectionStatusChanged) {
        subscriber.connectionStatusChanged(state)
      }
    })
  }

  async fundingSourceChanged(fundingSource: FundingSource): Promise<void> {
    await Promise.all(
      Object.values(this.subscribers).map(async (subscriber) => {
        if (subscriber) {
          return await subscriber.fundingSourceChanged(fundingSource)
        }
      }),
    )
  }
}
