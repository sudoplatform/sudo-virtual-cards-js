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
  DefaultLogger,
  FatalError,
  GraphQLNetworkError,
  isGraphQLNetworkError,
  Logger,
  mapNetworkErrorToClientError,
  UnknownGraphQLError,
} from '@sudoplatform/sudo-common'
import Observable from 'zen-observable'
import { GraphQLOptions } from '@aws-amplify/api-graphql'
import {
  CancelFundingSourceDocument,
  CancelFundingSourceMutation,
  CancelProvisionalFundingSourceDocument,
  CancelProvisionalFundingSourceMutation,
  CancelVirtualCardDocument,
  CancelVirtualCardMutation,
  CardCancelRequest,
  CardFilterInput,
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
  FundingSourceFilterInput,
  GetCardDocument,
  GetCardQuery,
  GetCardQueryVariables,
  GetFundingSourceClientConfigurationDocument,
  GetFundingSourceClientConfigurationQuery,
  GetFundingSourceDocument,
  GetFundingSourceQuery,
  GetKeyRingDocument,
  GetKeyRingQuery,
  GetKeyRingQueryVariables,
  GetProvisionalCardDocument,
  GetProvisionalCardQuery,
  GetPublicKeyDocument,
  GetPublicKeyQuery,
  GetPublicKeyQueryVariables,
  GetPublicKeysDocument,
  GetPublicKeysQuery,
  GetPublicKeysQueryVariables,
  GetTransactionDocument,
  GetTransactionQuery,
  GetTransactionQueryVariables,
  GetVirtualCardsConfigDocument,
  GetVirtualCardsConfigQuery,
  IdInput,
  KeyFormat,
  ListCardsDocument,
  ListCardsQuery,
  ListCardsQueryVariables,
  ListFundingSourcesDocument,
  ListFundingSourcesQuery,
  ListFundingSourcesQueryVariables,
  ListProvisionalCardsDocument,
  ListProvisionalCardsQuery,
  ListProvisionalCardsQueryVariables,
  ListProvisionalFundingSourcesDocument,
  ListProvisionalFundingSourcesQuery,
  ListProvisionalFundingSourcesQueryVariables,
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
  ProvisionalCard,
  ProvisionalCardConnection,
  ProvisionalFundingSource,
  ProvisionalFundingSourceConnection,
  ProvisionalFundingSourceFilterInput,
  ProvisionVirtualCardDocument,
  ProvisionVirtualCardMutation,
  PublicKey,
  RefreshFundingSourceDocument,
  RefreshFundingSourceMutation,
  RefreshFundingSourceRequest,
  ReviewUnfundedFundingSourceDocument,
  ReviewUnfundedFundingSourceMutation,
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
  SortOrder,
  UpdateVirtualCardDocument,
  UpdateVirtualCardMutation,
  VirtualCardsConfig,
} from '../../../gen/graphqlTypes'
import { ErrorTransformer } from './transformer/errorTransformer'
import { GraphQLClient } from '@sudoplatform/sudo-user'
import { SubscriptionResult } from './subscriptionManager'

export class ApiClient {
  private readonly log: Logger
  private readonly client: GraphQLClient

  public constructor(apiClientManager?: ApiClientManager) {
    this.log = new DefaultLogger(this.constructor.name)

    const clientManager =
      apiClientManager ?? DefaultApiClientManager.getInstance()

    this.client = clientManager.getClient({
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
      variables: { keyId, keyFormats } as GetPublicKeyQueryVariables,
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
      variables: { limit, nextToken } as GetPublicKeysQueryVariables,
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
      variables: {
        keyRingId,
        limit,
        nextToken,
        keyFormats,
      } as GetKeyRingQueryVariables,
      calleeName: this.getKeyRing.name,
    })
    return data.getKeyRingForVirtualCards
  }

  public async getFundingSourceClientConfiguration(): Promise<FundingSourceClientConfiguration> {
    const data =
      await this.performQuery<GetFundingSourceClientConfigurationQuery>({
        query: GetFundingSourceClientConfigurationDocument,
        calleeName: this.getFundingSourceClientConfiguration.name,
      })
    return data.getFundingSourceClientConfiguration
  }

  public async getFundingSource(
    id: string,
  ): Promise<FundingSource | undefined> {
    const data = await this.performQuery<GetFundingSourceQuery>({
      query: GetFundingSourceDocument,
      variables: { id },
      calleeName: this.getFundingSource.name,
    })
    return data.getFundingSource ?? undefined
  }

  public async listFundingSources(
    filter?: FundingSourceFilterInput,
    sortOrder?: SortOrder,
    limit?: number,
    nextToken?: string,
  ): Promise<FundingSourceConnection> {
    const data = await this.performQuery<ListFundingSourcesQuery>({
      query: ListFundingSourcesDocument,
      variables: {
        filter,
        sortOrder,
        limit,
        nextToken,
      } as ListFundingSourcesQueryVariables,
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

  public async onFundingSourceUpdate(
    owner: string,
  ): Promise<
    Observable<SubscriptionResult<OnFundingSourceUpdateSubscription>>
  > {
    return await this.client.subscribe({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      subscription: OnFundingSourceUpdateDocument,
      variables: { owner },
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

  public async reviewUnfundedFundingSource(
    input: IdInput,
  ): Promise<FundingSource> {
    const data =
      await this.performMutation<ReviewUnfundedFundingSourceMutation>({
        mutation: ReviewUnfundedFundingSourceDocument,
        variables: { input },
        calleeName: this.reviewUnfundedFundingSource.name,
      })
    return data.reviewUnfundedFundingSource
  }

  public async cancelProvisionalFundingSource(
    input: IdInput,
  ): Promise<ProvisionalFundingSource> {
    const data =
      await this.performMutation<CancelProvisionalFundingSourceMutation>({
        mutation: CancelProvisionalFundingSourceDocument,
        variables: { input },
        calleeName: this.cancelProvisionalFundingSource.name,
      })
    return data.cancelProvisionalFundingSource
  }

  public async listProvisionalFundingSources(
    filter?: ProvisionalFundingSourceFilterInput,
    sortOrder?: SortOrder,
    limit?: number,
    nextToken?: string,
  ): Promise<ProvisionalFundingSourceConnection> {
    const data = await this.performQuery<ListProvisionalFundingSourcesQuery>({
      query: ListProvisionalFundingSourcesDocument,
      variables: {
        filter,
        sortOrder,
        limit,
        nextToken,
      } as ListProvisionalFundingSourcesQueryVariables,
      calleeName: this.listFundingSources.name,
    })
    return data.listProvisionalFundingSources
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
  ): Promise<ProvisionalCard | undefined> {
    const data = await this.performQuery<GetProvisionalCardQuery>({
      query: GetProvisionalCardDocument,
      variables: { id },
      calleeName: this.getProvisionalCard.name,
    })
    return data.getProvisionalCard ?? undefined
  }

  public async listProvisionalCards(
    limit?: number,
    nextToken?: string,
  ): Promise<ProvisionalCardConnection> {
    const data = await this.performQuery<ListProvisionalCardsQuery>({
      query: ListProvisionalCardsDocument,
      variables: { limit, nextToken } as ListProvisionalCardsQueryVariables,
      calleeName: this.listProvisionalCards.name,
    })
    return data.listProvisionalCards
  }

  public async getCard(
    input: GetCardQueryVariables,
  ): Promise<SealedCard | undefined> {
    const data = await this.performQuery<GetCardQuery>({
      query: GetCardDocument,
      variables: input,
      calleeName: this.getCard.name,
    })
    return data.getCard ?? undefined
  }

  public async listCards(
    filter?: CardFilterInput,
    sortOrder?: SortOrder,
    limit?: number,
    nextToken?: string,
  ): Promise<SealedCardConnection> {
    const data = await this.performQuery<ListCardsQuery>({
      query: ListCardsDocument,
      variables: {
        filter,
        sortOrder,
        limit,
        nextToken,
      } as ListCardsQueryVariables,
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
  ): Promise<SealedTransaction | undefined> {
    const data = await this.performQuery<GetTransactionQuery>({
      query: GetTransactionDocument,
      variables: input,
      calleeName: this.getTransaction.name,
    })
    return data.getTransaction ?? undefined
  }

  async listTransactions(
    input: ListTransactionsQueryVariables,
  ): Promise<SealedTransactionConnection> {
    const data = await this.performQuery<ListTransactionsQuery>({
      query: ListTransactionsDocument,
      variables: input,
      calleeName: this.listTransactionsByCardId.name,
    })
    return data.listTransactions2
  }

  async listTransactionsByCardId(
    input: ListTransactionsByCardIdQueryVariables,
  ): Promise<SealedTransactionConnection> {
    const data = await this.performQuery<ListTransactionsByCardIdQuery>({
      query: ListTransactionsByCardIdDocument,
      variables: input,
      calleeName: this.listTransactionsByCardId.name,
    })
    return data.listTransactionsByCardId2
  }

  async listTransactionsByCardIdAndType(
    input: ListTransactionsByCardIdAndTypeQueryVariables,
  ): Promise<SealedTransactionConnection> {
    const data = await this.performQuery<ListTransactionsByCardIdAndTypeQuery>({
      query: ListTransactionsByCardIdAndTypeDocument,
      variables: input,
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
          variables: input,
          calleeName: this.sandboxSetFundingSourceToRequireRefresh.name,
        },
      )

    return data.sandboxSetFundingSourceToRequireRefresh
  }

  async performQuery<Q>({
    variables,
    query,
    calleeName,
  }: GraphQLOptions & { calleeName?: string }): Promise<Q> {
    let result
    try {
      result = await this.client.query<Q>({
        variables,
        query,
      })
    } catch (err: any) {
      if (isGraphQLNetworkError(err as Error)) {
        throw mapNetworkErrorToClientError(err as GraphQLNetworkError)
      }
      throw this.mapGraphQLCallError(err as Error)
    }
    const error = result.errors?.[0]
    if (error) {
      this.log.debug('appsync query failed with error', { error })
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
  }: Omit<GraphQLOptions, 'query'> & {
    mutation: GraphQLOptions['query']
    calleeName?: string
  }): Promise<M> {
    let result
    try {
      result = await this.client.mutate<M>({
        mutation,
        variables,
      })
    } catch (err) {
      if (isGraphQLNetworkError(err as Error)) {
        throw mapNetworkErrorToClientError(err as GraphQLNetworkError)
      }
      throw this.mapGraphQLCallError(err as Error)
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
    subscription,
    variables,
    calleeName,
  }: Omit<GraphQLOptions, 'query'> & {
    subscription: GraphQLOptions['query']
    calleeName?: string
  }): Promise<Observable<SubscriptionResult<S>> | undefined> {
    let result
    try {
      result = this.client.subscribe<S>({
        subscription,
        variables,
      })
    } catch (err) {
      if (isGraphQLNetworkError(err as Error)) {
        throw mapNetworkErrorToClientError(err as GraphQLNetworkError)
      }
      this.log.debug('appSync subscription failed with error', {
        error: err as Error,
        calleeName,
      })
      throw this.mapGraphQLCallError(err as Error)
    }
    return result
  }

  mapGraphQLCallError = (err: Error): Error => {
    if ('graphQLErrors' in err && Array.isArray(err.graphQLErrors)) {
      const error = err.graphQLErrors[0] as {
        errorType: string
        message: string
        name: string
      }
      if (error) {
        this.log.debug('appSync operation failed with error', { err })
        return ErrorTransformer.toClientError(error)
      }
    }
    if ('errorType' in err) {
      this.log.debug('appSync operation failed with error', { err })
      return ErrorTransformer.toClientError(
        err as { errorType: string; message: string; errorInfo?: string },
      )
    }
    return new UnknownGraphQLError(err)
  }
}
