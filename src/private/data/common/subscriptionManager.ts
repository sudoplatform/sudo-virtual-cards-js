import { DefaultLogger, Logger } from '@sudoplatform/sudo-common'
import { Observable } from 'apollo-client/util/Observable'
import { FetchResult } from 'apollo-link'
import { OnFundingSourceUpdateSubscription } from '../../../gen/graphqlTypes'
import { FundingSource, FundingSourceUpdateSubscriber } from '../../../public'
import { ApiClient } from './apiClient'

export type Subscribable = OnFundingSourceUpdateSubscription
export class SubscriptionManager<
  T extends Subscribable,
  S extends FundingSourceUpdateSubscriber,
> implements FundingSourceUpdateSubscriber
{
  private readonly log: Logger
  private subscribers: Record<string, S | undefined> = {}

  private _subscription: ZenObservable.Subscription | undefined = undefined

  private _watcher: Observable<FetchResult<T>> | undefined = undefined

  public constructor(private readonly apiClient: ApiClient) {
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
