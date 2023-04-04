import { mock, reset } from 'ts-mockito'
import {
  ConnectionState,
  FundingSource,
  FundingSourceChangeSubscriber,
} from '../../../../../src'
import { OnFundingSourceUpdateSubscription } from '../../../../../src/gen/graphqlTypes'
import { ApiClient } from '../../../../../src/private/data/common/apiClient'
import { SubscriptionManager } from '../../../../../src/private/data/common/subscriptionManager'
import { EntityDataFactory } from '../../../data-factory/entity'

describe('SubscriptionManager test suite', () => {
  const mockApiClient = mock<ApiClient>()

  let subscriptionCalled = false
  let notifiedFundingSourceId: string | undefined = undefined
  let connectionStateChangeCalled = false
  let connectionState: ConnectionState = ConnectionState.Disconnected

  const defaultSubscriber = {
    fundingSourceChanged(fundingSource: FundingSource): Promise<void> {
      subscriptionCalled = true
      notifiedFundingSourceId = fundingSource.id
      return Promise.resolve()
    },
    connectionStatusChanged(state: ConnectionState): void {
      connectionStateChangeCalled = true
      connectionState = state
    },
  }

  let iut: SubscriptionManager<
    OnFundingSourceUpdateSubscription,
    FundingSourceChangeSubscriber
  >

  beforeEach(() => {
    reset(mockApiClient)

    iut = new SubscriptionManager<
      OnFundingSourceUpdateSubscription,
      FundingSourceChangeSubscriber
    >()
  })

  it('connectionStateChanged should call subscribed callback', () => {
    iut.subscribe('dummy-id', defaultSubscriber)

    void iut.connectionStatusChanged(ConnectionState.Connected)
    expect(connectionStateChangeCalled).toBeTruthy()
    expect(connectionState).toBe(ConnectionState.Connected)
    expect(subscriptionCalled).toBeFalsy()
    expect(notifiedFundingSourceId).toBeUndefined()
  })

  it('connectionStateChanged should not call unsubscribed callback', () => {
    iut.subscribe('dummy-id', defaultSubscriber)

    void iut.connectionStatusChanged(ConnectionState.Connected)
    expect(connectionStateChangeCalled).toBeTruthy()
    expect(connectionState).toBe(ConnectionState.Connected)
    expect(subscriptionCalled).toBeFalsy()
    expect(notifiedFundingSourceId).toBeUndefined()

    connectionStateChangeCalled = false
    connectionState = ConnectionState.Disconnected

    iut.unsubscribe('dummy-id')
    void iut.connectionStatusChanged(ConnectionState.Connected)
    expect(connectionStateChangeCalled).toBeFalsy()
    expect(connectionState).toBe(ConnectionState.Disconnected)
    expect(subscriptionCalled).toBeFalsy()
    expect(notifiedFundingSourceId).toBeUndefined()
  })

  it('onFundingSourceChanged should call subscribed callback', async () => {
    iut.subscribe('dummy-id', defaultSubscriber)

    const fundingSource = EntityDataFactory.defaultFundingSource
    await iut.fundingSourceChanged(fundingSource)
    expect(connectionStateChangeCalled).toBeFalsy()
    expect(connectionState).toBe(ConnectionState.Disconnected)
    expect(subscriptionCalled).toBeTruthy()
    expect(notifiedFundingSourceId).toBe(fundingSource.id)
  })

  it('onFundingSourceChanged should not call unsubscribed callback', async () => {
    iut.subscribe('dummy-id', defaultSubscriber)

    const fundingSource = EntityDataFactory.defaultFundingSource
    void iut.fundingSourceChanged(fundingSource)
    expect(connectionStateChangeCalled).toBeFalsy()
    expect(connectionState).toBe(ConnectionState.Disconnected)
    expect(subscriptionCalled).toBeTruthy()
    expect(notifiedFundingSourceId).toBe(fundingSource.id)

    subscriptionCalled = false
    notifiedFundingSourceId = undefined
    iut.unsubscribe('dummy-id')

    await iut.fundingSourceChanged(fundingSource)
    expect(connectionStateChangeCalled).toBeFalsy()
    expect(connectionState).toBe(ConnectionState.Disconnected)
    expect(subscriptionCalled).toBeFalsy()
    expect(notifiedFundingSourceId).toBeUndefined()
  })

  it('unsubscribe different id does not unsubscribe all', async () => {
    iut.subscribe('dummy-id', defaultSubscriber)

    const fundingSource = EntityDataFactory.defaultFundingSource
    void iut.fundingSourceChanged(fundingSource)
    expect(connectionStateChangeCalled).toBeFalsy()
    expect(connectionState).toBe(ConnectionState.Disconnected)
    expect(subscriptionCalled).toBeTruthy()
    expect(notifiedFundingSourceId).toBe(fundingSource.id)

    subscriptionCalled = false
    notifiedFundingSourceId = undefined
    iut.unsubscribe('dummy-id-2')

    await iut.fundingSourceChanged(fundingSource)
    expect(connectionStateChangeCalled).toBeFalsy()
    expect(connectionState).toBe(ConnectionState.Disconnected)
    expect(subscriptionCalled).toBeTruthy()
    expect(notifiedFundingSourceId).toBe(fundingSource.id)
  })

  it('subscribe same id overwrites previous subscription', async () => {
    iut.subscribe('dummy-id', {
      connectionStatusChanged(state: ConnectionState): void {
        fail(
          'unexpectedly invoked incorrect connection status changed callback',
        )
      },
      fundingSourceChanged(fundingSource: FundingSource): Promise<void> {
        fail('unexpectedly invoked incorrect funding source updated callback')
        return Promise.resolve(undefined)
      },
    })
    iut.subscribe('dummy-id', defaultSubscriber)

    const fundingSource = EntityDataFactory.defaultFundingSource
    await iut.fundingSourceChanged(fundingSource)
    expect(connectionStateChangeCalled).toBeFalsy()
    expect(connectionState).toBe(ConnectionState.Disconnected)
    expect(subscriptionCalled).toBeTruthy()
    expect(notifiedFundingSourceId).toBe(fundingSource.id)

    iut.connectionStatusChanged(ConnectionState.Connected)
    expect(connectionStateChangeCalled).toBeTruthy()
    expect(connectionState).toBe(ConnectionState.Connected)
  })
})
