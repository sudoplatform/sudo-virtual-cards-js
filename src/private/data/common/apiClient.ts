/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApiClientManager,
  DefaultApiClientManager,
} from '@sudoplatform/sudo-api-client'
import {
  AppSyncError,
  DefaultLogger,
  FatalError,
  Logger,
  UnknownGraphQLError,
} from '@sudoplatform/sudo-common'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import {
  FetchPolicy,
  MutationOptions,
  QueryOptions,
  SubscriptionOptions,
} from 'apollo-client/core/watchQueryOptions'
import { ApolloError } from 'apollo-client/errors/ApolloError'
import { Observable } from 'apollo-client/util/Observable'
import { FetchResult } from 'apollo-link'
import AWSAppSyncClient from 'aws-appsync'
import {
  CancelFundingSourceDocument,
  CancelFundingSourceMutation,
  CancelVirtualCardDocument,
  CancelVirtualCardMutation,
  CardCancelRequest,
  CardProvisionRequest,
  CardUpdateRequest,
  CompleteFundingSourceDocument,
  CompleteFundingSourceMutation,
  CompleteFundingSourceRequest,
  CreatePublicKeyDocument,
  CreatePublicKeyInput,
  CreatePublicKeyMutation,
  FundingSource,
  FundingSourceClientConfiguration,
  FundingSourceConnection,
  GetCardDocument,
  GetCardQuery,
  GetCardQueryVariables,
  GetFundingSourceClientConfigurationDocument,
  GetFundingSourceClientConfigurationQuery,
  GetFundingSourceDocument,
  GetFundingSourceQuery,
  GetKeyRingDocument,
  GetKeyRingQuery,
  GetProvisionalCardDocument,
  GetProvisionalCardQuery,
  GetPublicKeyDocument,
  GetPublicKeyQuery,
  GetPublicKeysDocument,
  GetPublicKeysQuery,
  GetTransactionDocument,
  GetTransactionQuery,
  GetTransactionQueryVariables,
  GetVirtualCardsConfigDocument,
  GetVirtualCardsConfigQuery,
  IdInput,
  KeyFormat,
  ListCardsDocument,
  ListCardsQuery,
  ListFundingSourcesDocument,
  ListFundingSourcesQuery,
  ListProvisionalCardsDocument,
  ListProvisionalCardsQuery,
  ListTransactionsByCardIdAndTypeDocument,
  ListTransactionsByCardIdAndTypeQuery,
  ListTransactionsByCardIdAndTypeQueryVariables,
  ListTransactionsByCardIdDocument,
  ListTransactionsByCardIdQuery,
  ListTransactionsByCardIdQueryVariables,
  ListTransactionsDocument,
  ListTransactionsQuery,
  ListTransactionsQueryVariables,
  OnFundingSourceUpdateDocument,
  OnFundingSourceUpdateSubscription,
  PaginatedPublicKey,
  ProvisionVirtualCardDocument,
  ProvisionVirtualCardMutation,
  ProvisionalCard,
  ProvisionalCardConnection,
  ProvisionalFundingSource,
  PublicKey,
  RefreshFundingSourceDocument,
  RefreshFundingSourceMutation,
  RefreshFundingSourceRequest,
  SandboxGetPlaidDataDocument,
  SandboxGetPlaidDataQuery,
  SandboxGetPlaidDataQueryVariables,
  SandboxGetPlaidDataResponse,
  SandboxSetFundingSourceToRequireRefreshDocument,
  SandboxSetFundingSourceToRequireRefreshMutation,
  SandboxSetFundingSourceToRequireRefreshMutationVariables,
  SealedCard,
  SealedCardConnection,
  SealedTransaction,
  SealedTransactionConnection,
  SetupFundingSourceDocument,
  SetupFundingSourceMutation,
  SetupFundingSourceRequest,
  UpdateVirtualCardDocument,
  UpdateVirtualCardMutation,
  VirtualCardsConfig,
} from '../../../gen/graphqlTypes'
import { ErrorTransformer } from './transformer/errorTransformer'
export class ApiClient {
  private readonly log: Logger
  private readonly client: AWSAppSyncClient<NormalizedCacheObject>

  public constructor(apiClientManager?: ApiClientManager) {
    this.log = new DefaultLogger(this.constructor.name)

    const clientManager =
      apiClientManager ?? DefaultApiClientManager.getInstance()

    this.client = clientManager.getClient({
      disableOffline: true,
      configNamespace: 'vcService',
    })
  }

  public async getVirtualCardsConfig(): Promise<VirtualCardsConfig> {
    const data = await this.performQuery<GetVirtualCardsConfigQuery>({
      query: GetVirtualCardsConfigDocument,
      variables: {},
      calleeName: this.getVirtualCardsConfig.name,
    })
    return data.getVirtualCardsConfig
  }

  public async createPublicKey(
    input: CreatePublicKeyInput,
  ): Promise<PublicKey> {
    const data = await this.performMutation<CreatePublicKeyMutation>({
      mutation: CreatePublicKeyDocument,
      variables: { input },
      calleeName: this.createPublicKey.name,
    })
    return data.createPublicKeyForVirtualCards
  }

  public async getPublicKey(
    keyId: string,
    keyFormats?: KeyFormat[],
  ): Promise<PublicKey | undefined> {
    const data = await this.performQuery<GetPublicKeyQuery>({
      query: GetPublicKeyDocument,
      variables: { keyId, keyFormats },
      fetchPolicy: 'network-only',
      calleeName: this.getPublicKey.name,
    })
    return data.getPublicKeyForVirtualCards ?? undefined
  }

  public async getPublicKeys(
    limit?: number,
    nextToken?: string,
  ): Promise<PaginatedPublicKey> {
    const data = await this.performQuery<GetPublicKeysQuery>({
      query: GetPublicKeysDocument,
      variables: { limit, nextToken },
      fetchPolicy: 'network-only',
      calleeName: this.getPublicKeys.name,
    })
    return data.getPublicKeysForVirtualCards
  }

  public async getKeyRing({
    keyRingId,
    limit,
    nextToken,
    keyFormats,
  }: {
    keyRingId: string
    limit?: number
    nextToken?: string
    keyFormats?: KeyFormat[]
  }): Promise<PaginatedPublicKey> {
    const data = await this.performQuery<GetKeyRingQuery>({
      query: GetKeyRingDocument,
      variables: { keyRingId, limit, nextToken, keyFormats },
      fetchPolicy: 'network-only',
      calleeName: this.getKeyRing.name,
    })
    return data.getKeyRingForVirtualCards
  }

  public async getFundingSourceClientConfiguration(): Promise<FundingSourceClientConfiguration> {
    const data =
      await this.performQuery<GetFundingSourceClientConfigurationQuery>({
        query: GetFundingSourceClientConfigurationDocument,
        fetchPolicy: 'network-only',
        calleeName: this.getFundingSourceClientConfiguration.name,
      })
    return data.getFundingSourceClientConfiguration
  }

  public async getFundingSource(
    id: string,
    fetchPolicy: FetchPolicy = 'network-only',
  ): Promise<FundingSource | undefined> {
    const data = await this.performQuery<GetFundingSourceQuery>({
      query: GetFundingSourceDocument,
      variables: { id },
      fetchPolicy,
      calleeName: this.getFundingSource.name,
    })
    return data.getFundingSource ?? undefined
  }

  public async listFundingSources(
    fetchPolicy: FetchPolicy = 'network-only',
    limit?: number,
    nextToken?: string,
  ): Promise<FundingSourceConnection> {
    const data = await this.performQuery<ListFundingSourcesQuery>({
      query: ListFundingSourcesDocument,
      variables: { limit, nextToken },
      fetchPolicy,
      calleeName: this.listFundingSources.name,
    })
    return data.listFundingSources
  }

  public async setupFundingSource(
    input: SetupFundingSourceRequest,
  ): Promise<ProvisionalFundingSource> {
    const data = await this.performMutation<SetupFundingSourceMutation>({
      mutation: SetupFundingSourceDocument,
      variables: { input },
      calleeName: this.setupFundingSource.name,
    })
    return data.setupFundingSource
  }

  public async completeFundingSource(
    input: CompleteFundingSourceRequest,
  ): Promise<FundingSource> {
    const data = await this.performMutation<CompleteFundingSourceMutation>({
      mutation: CompleteFundingSourceDocument,
      variables: { input },
      calleeName: this.completeFundingSource.name,
    })
    return data.completeFundingSource
  }

  public async refreshFundingSource(
    input: RefreshFundingSourceRequest,
  ): Promise<FundingSource> {
    const data = await this.performMutation<RefreshFundingSourceMutation>({
      mutation: RefreshFundingSourceDocument,
      variables: { input },
      calleeName: this.refreshFundingSource.name,
    })
    return data.refreshFundingSource
  }

  public onFundingSourceUpdate(
    owner: string,
  ): Observable<FetchResult<OnFundingSourceUpdateSubscription>> {
    return this.client.subscribe<OnFundingSourceUpdateSubscription>({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      query: OnFundingSourceUpdateDocument,
      variables: { owner },
      fetchPolicy: 'network-only',
    })
  }

  public async cancelFundingSource(input: IdInput): Promise<FundingSource> {
    const data = await this.performMutation<CancelFundingSourceMutation>({
      mutation: CancelFundingSourceDocument,
      variables: { input },
      calleeName: this.cancelFundingSource.name,
    })
    return data.cancelFundingSource
  }

  async provisionVirtualCard(
    input: CardProvisionRequest,
  ): Promise<ProvisionalCard> {
    const data = await this.performMutation<ProvisionVirtualCardMutation>({
      mutation: ProvisionVirtualCardDocument,
      variables: { input },
      calleeName: this.provisionVirtualCard.name,
    })
    return data.cardProvision
  }

  public async getProvisionalCard(
    id: string,
    fetchPolicy: FetchPolicy = 'network-only',
  ): Promise<ProvisionalCard | undefined> {
    const data = await this.performQuery<GetProvisionalCardQuery>({
      query: GetProvisionalCardDocument,
      fetchPolicy,
      variables: { id },
      calleeName: this.getProvisionalCard.name,
    })
    return data.getProvisionalCard ?? undefined
  }

  public async listProvisionalCards(
    limit?: number,
    nextToken?: string,
    fetchPolicy: FetchPolicy = 'network-only',
  ): Promise<ProvisionalCardConnection> {
    const data = await this.performQuery<ListProvisionalCardsQuery>({
      query: ListProvisionalCardsDocument,
      fetchPolicy,
      variables: { limit, nextToken },
      calleeName: this.listProvisionalCards.name,
    })
    return data.listProvisionalCards
  }

  public async getCard(
    input: GetCardQueryVariables,
    fetchPolicy: FetchPolicy = 'network-only',
  ): Promise<SealedCard | undefined> {
    const data = await this.performQuery<GetCardQuery>({
      query: GetCardDocument,
      fetchPolicy,
      variables: input,
      calleeName: this.getCard.name,
    })
    return data.getCard ?? undefined
  }

  public async listCards(
    limit?: number,
    nextToken?: string,
    fetchPolicy: FetchPolicy = 'network-only',
  ): Promise<SealedCardConnection> {
    const data = await this.performQuery<ListCardsQuery>({
      query: ListCardsDocument,
      fetchPolicy,
      variables: { limit, nextToken },
      calleeName: this.listCards.name,
    })
    return data.listCards
  }

  async updateVirtualCard(input: CardUpdateRequest): Promise<SealedCard> {
    const data = await this.performMutation<UpdateVirtualCardMutation>({
      mutation: UpdateVirtualCardDocument,
      variables: { input },
      calleeName: this.updateVirtualCard.name,
    })
    return data.updateCard
  }

  async cancelVirtualCard(input: CardCancelRequest): Promise<SealedCard> {
    const data = await this.performMutation<CancelVirtualCardMutation>({
      mutation: CancelVirtualCardDocument,
      variables: { input },
      calleeName: this.cancelVirtualCard.name,
    })
    return data.cancelCard
  }

  async getTransaction(
    input: GetTransactionQueryVariables,
    fetchPolicy: FetchPolicy = 'network-only',
  ): Promise<SealedTransaction | undefined> {
    const data = await this.performQuery<GetTransactionQuery>({
      query: GetTransactionDocument,
      variables: input,
      fetchPolicy,
      calleeName: this.getTransaction.name,
    })
    return data.getTransaction ?? undefined
  }

  async listTransactions(
    input: ListTransactionsQueryVariables,
    fetchPolicy: FetchPolicy = 'network-only',
  ): Promise<SealedTransactionConnection> {
    const data = await this.performQuery<ListTransactionsQuery>({
      query: ListTransactionsDocument,
      variables: input,
      fetchPolicy,
      calleeName: this.listTransactionsByCardId.name,
    })
    return data.listTransactions2
  }

  async listTransactionsByCardId(
    input: ListTransactionsByCardIdQueryVariables,
    fetchPolicy: FetchPolicy = 'network-only',
  ): Promise<SealedTransactionConnection> {
    const data = await this.performQuery<ListTransactionsByCardIdQuery>({
      query: ListTransactionsByCardIdDocument,
      variables: input,
      fetchPolicy,
      calleeName: this.listTransactionsByCardId.name,
    })
    return data.listTransactionsByCardId2
  }

  async listTransactionsByCardIdAndType(
    input: ListTransactionsByCardIdAndTypeQueryVariables,
    fetchPolicy: FetchPolicy = 'network-only',
  ): Promise<SealedTransactionConnection> {
    const data = await this.performQuery<ListTransactionsByCardIdAndTypeQuery>({
      query: ListTransactionsByCardIdAndTypeDocument,
      variables: input,
      fetchPolicy,
      calleeName: this.listTransactionsByCardIdAndType.name,
    })
    return data.listTransactionsByCardIdAndType
  }

  async sandboxGetPlaidData(
    input: SandboxGetPlaidDataQueryVariables,
  ): Promise<SandboxGetPlaidDataResponse> {
    const data = await this.performQuery<SandboxGetPlaidDataQuery>({
      query: SandboxGetPlaidDataDocument,
      variables: input,
      fetchPolicy: 'network-only',
      calleeName: this.sandboxGetPlaidData.name,
    })

    return data.sandboxGetPlaidData
  }

  async sandboxSetFundingSourceToRequireRefresh(
    input: SandboxSetFundingSourceToRequireRefreshMutationVariables,
  ): Promise<FundingSource> {
    const data =
      await this.performMutation<SandboxSetFundingSourceToRequireRefreshMutation>(
        {
          mutation: SandboxSetFundingSourceToRequireRefreshDocument,
          variables: { input },
          calleeName: this.sandboxSetFundingSourceToRequireRefresh.name,
        },
      )

    return data.sandboxSetFundingSourceToRequireRefresh
  }

  async performQuery<Q>({
    variables,
    fetchPolicy,
    query,
    calleeName,
  }: QueryOptions & { calleeName?: string }): Promise<Q> {
    let result
    try {
      result = await this.client.query<Q>({
        variables,
        fetchPolicy,
        query,
      })
    } catch (err: any) {
      const clientError = err as ApolloError
      this.log.debug('error received', { calleeName, clientError })
      const error = clientError.graphQLErrors?.[0]
      if (error) {
        this.log.debug('appSync query failed with error', { error })
        throw ErrorTransformer.toClientError(error)
      } else {
        throw new UnknownGraphQLError(err)
      }
    }
    const error = result.errors?.[0]
    if (error) {
      this.log.debug('error received', { error })
      throw ErrorTransformer.toClientError(error)
    }
    if (result.data) {
      return result.data
    } else {
      throw new FatalError(
        `${calleeName ?? '<no callee>'} did not return any result`,
      )
    }
  }

  async performMutation<M>({
    mutation,
    variables,
    calleeName,
  }: Omit<MutationOptions<M>, 'fetchPolicy'> & {
    calleeName?: string
  }): Promise<M> {
    let result
    try {
      result = await this.client.mutate<M>({
        mutation,
        variables,
      })
    } catch (err) {
      const clientError = err as ApolloError
      this.log.debug('error received', { calleeName, clientError })
      const error = clientError.graphQLErrors?.[0]
      if (error) {
        this.log.debug('appSync mutation failed with error', { error })
        throw ErrorTransformer.toClientError(error)
      } else {
        throw new UnknownGraphQLError(err as AppSyncError)
      }
    }
    const error = result.errors?.[0]
    if (error) {
      this.log.debug('appSync mutation failed with error', { error })
      throw ErrorTransformer.toClientError(error)
    }
    if (result.data) {
      return result.data
    } else {
      throw new FatalError(
        `${calleeName ?? '<no callee>'} did not return any result`,
      )
    }
  }

  subscribeTo<S>({
    query,
    variables,
    calleeName,
  }: Omit<SubscriptionOptions, 'fetchPolicy'> & {
    calleeName?: string
  }): Observable<FetchResult<S>> | undefined {
    let result
    try {
      result = this.client.subscribe<S>({
        query,
        variables,
      })
    } catch (err) {
      const clientError = err as ApolloError
      this.log.debug('error received', { calleeName, clientError })
      const error = clientError.graphQLErrors?.[0]
      if (error) {
        this.log.debug('appSync subscription failed with error', { error })
        throw ErrorTransformer.toClientError(error)
      } else {
        throw new UnknownGraphQLError(err as AppSyncError)
      }
    }
    return result
  }
}
