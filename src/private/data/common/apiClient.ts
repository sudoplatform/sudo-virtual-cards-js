/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApiClientManager,
  DefaultApiClientManager,
} from '@sudoplatform/sudo-api-client'
import {
  AppSyncError,
  DefaultLogger,
  FatalError,
  UnknownGraphQLError,
} from '@sudoplatform/sudo-common'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { OperationVariables } from 'apollo-client/core/types'
import {
  FetchPolicy,
  MutationOptions,
  QueryOptions,
} from 'apollo-client/core/watchQueryOptions'
import { ApolloError } from 'apollo-client/errors/ApolloError'
import AWSAppSyncClient from 'aws-appsync'
import {
  CancelFundingSourceDocument,
  CancelFundingSourceMutation,
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
  ListTransactionsByCardIdDocument,
  ListTransactionsByCardIdQuery,
  ListTransactionsByCardIdQueryVariables,
  PaginatedPublicKey,
  ProvisionalCard,
  ProvisionalCardConnection,
  ProvisionalCardFilterInput,
  ProvisionalFundingSource,
  ProvisionVirtualCardDocument,
  ProvisionVirtualCardMutation,
  PublicKey,
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
  private readonly log = new DefaultLogger(this.constructor.name)
  private readonly client: AWSAppSyncClient<NormalizedCacheObject>

  public constructor(apiClientManager?: ApiClientManager) {
    const clientManager =
      apiClientManager ?? DefaultApiClientManager.getInstance()
    this.client = clientManager.getClient({ disableOffline: true })
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

  public async getPublicKey(keyId: string): Promise<PublicKey | undefined> {
    const data = await this.performQuery<GetPublicKeyQuery>({
      query: GetPublicKeyDocument,
      variables: { keyId },
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
    filter?: ProvisionalCardFilterInput,
    limit?: number,
    nextToken?: string,
    fetchPolicy: FetchPolicy = 'network-only',
  ): Promise<ProvisionalCardConnection> {
    const data = await this.performQuery<ListProvisionalCardsQuery>({
      query: ListProvisionalCardsDocument,
      fetchPolicy,
      variables: { filter, limit, nextToken },
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
    filter?: CardFilterInput,
    limit?: number,
    nextToken?: string,
    fetchPolicy: FetchPolicy = 'network-only',
  ): Promise<SealedCardConnection> {
    const data = await this.performQuery<ListCardsQuery>({
      query: ListCardsDocument,
      fetchPolicy,
      variables: { filter, limit, nextToken },
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
    return data.listTransactionsByCardId
  }

  async performQuery<Q, QVariables = OperationVariables>({
    variables,
    fetchPolicy,
    query,
    calleeName,
  }: QueryOptions<QVariables> & { calleeName?: string }): Promise<Q> {
    let result
    try {
      result = await this.client.query<Q>({
        variables: variables,
        fetchPolicy: fetchPolicy,
        query: query,
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

  async performMutation<M, MVariables = OperationVariables>({
    mutation,
    variables,
    calleeName,
  }: Omit<MutationOptions<M, MVariables>, 'fetchPolicy'> & {
    calleeName?: string
  }): Promise<M> {
    let result
    try {
      result = await this.client.mutate<M>({
        mutation: mutation,
        variables: variables,
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
}
