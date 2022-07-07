import {
  Base64,
  CachePolicy,
  DefaultConfigurationManager,
  DefaultLogger,
  DefaultSudoKeyManager,
  ListOutput,
  SudoCryptoProvider,
  SudoKeyManager,
} from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { WebSudoCryptoProvider } from '@sudoplatform/sudo-web-crypto-provider'
import { Mutex } from 'async-mutex'
import { ApiClient } from '../private/data/common/apiClient'
import {
  DefaultDeviceKeyWorker,
  DeviceKeyWorker,
} from '../private/data/common/deviceKeyWorker'
import { SudoVirtualCardsClientPrivateOptions } from '../private/data/common/privateSudoVirtualCardsClientOptions'
import {
  DefaultTransactionWorker,
  TransactionWorker,
} from '../private/data/common/transactionWorker'
import { DefaultVirtualCardsConfigService } from '../private/data/configuration/defaultConfigService'
import { DefaultFundingSourceService } from '../private/data/fundingSource/defaultFundingSourceService'
import { ProvisionalFundingSourceApiTransformer } from '../private/data/fundingSource/transformer/provisionalFundingSourceApiTransformer'
import { DefaultKeyService } from '../private/data/key/defaultKeyService'
import { DefaultSudoUserService } from '../private/data/sudoUser/defaultSudoUserService'
import { DefaultTransactionService } from '../private/data/transaction/defaultTransactionService'
import { DefaultVirtualCardService } from '../private/data/virtualCard/defaultVirtualCardService'
import { KeyService } from '../private/domain/entities/key/keyService'
import { SudoUserService } from '../private/domain/entities/sudoUser/sudoUserService'
import { TransactionService } from '../private/domain/entities/transaction/transactionService'
import { VirtualCardService } from '../private/domain/entities/virtualCard/virtualCardService'
import { GetVirtualCardsConfigUseCase } from '../private/domain/use-cases/configuration/getConfigUseCase'
import { CancelFundingSourceUseCase } from '../private/domain/use-cases/fundingSource/cancelFundingSourceUseCase'
import { CompleteFundingSourceUseCase } from '../private/domain/use-cases/fundingSource/completeFundingSourceUseCase'
import { GetFundingSourceClientConfigurationUseCase } from '../private/domain/use-cases/fundingSource/getFundingSourceClientConfigurationUseCase'
import { GetFundingSourceUseCase } from '../private/domain/use-cases/fundingSource/getFundingSourceUseCase'
import { ListFundingSourcesUseCase } from '../private/domain/use-cases/fundingSource/listFundingSourcesUseCase'
import { SetupFundingSourceUseCase } from '../private/domain/use-cases/fundingSource/setupFundingSourceUseCase'
import { CreateKeysIfAbsentUseCase } from '../private/domain/use-cases/key/createKeysIfAbsent'
import { GetTransactionUseCase } from '../private/domain/use-cases/transaction/getTransactionUseCase'
import { ListTransactionsByCardIdUseCase } from '../private/domain/use-cases/transaction/listTransactionsByCardIdUseCase'
import { CancelVirtualCardUseCase } from '../private/domain/use-cases/virtualCard/cancelVirtualCardUseCase'
import { GetProvisionalCardUseCase } from '../private/domain/use-cases/virtualCard/getProvisionalCardUseCase'
import { GetVirtualCardUseCase } from '../private/domain/use-cases/virtualCard/getVirtualCardUseCase'
import { ListProvisionalCardsUseCase } from '../private/domain/use-cases/virtualCard/listProvisionalCardsUseCase'
import { ListVirtualCardsUseCase } from '../private/domain/use-cases/virtualCard/listVirtualCardsUseCase'
import { ProvisionVirtualCardUseCase } from '../private/domain/use-cases/virtualCard/provisionVirtualCardUseCase'
import { UpdateVirtualCardUseCase } from '../private/domain/use-cases/virtualCard/updateVirtualCardUseCase'
import { VirtualCardsServiceConfigNotFoundError } from './errors'
import {
  APIResult,
  CreateKeyIfAbsentResult,
  ProvisionalVirtualCard,
} from './typings'
import { VirtualCardsConfig } from './typings/config'
import { DateRange } from './typings/dateRange'
import {
  FundingSource,
  FundingSourceClientConfiguration,
  FundingSourceType,
  ProvisionalFundingSource,
} from './typings/fundingSource'
import {
  ListProvisionalCardsResults,
  ListTransactionsResults,
  ListVirtualCardsResults,
} from './typings/listOperationResult'
import { Metadata } from './typings/metadata'
import { SortOrder } from './typings/sortOrder'
import { Transaction } from './typings/transaction'
import {
  BillingAddress,
  VirtualCard,
  VirtualCardSealedAttributes,
} from './typings/virtualCard'

/**
 * Input for {@link SudoVirtualCardsClient#setupFundingSource}.
 *
 * @property {string} currency The ISO 4217 currency code that is being used for the setup.
 * @property {FundingSourceType} type The type of the funding source being setup.
 */
export interface SetupFundingSourceInput {
  currency: string
  type: FundingSourceType
}

/**
 * Input for the completion data of {@link SudoVirtualCardsClient#completeFundingSource}.
 *
 * @property {string} provider Provider used to save the funding source information.
 * @property {string} paymentMethod Identifier of the Payment Method used.
 */
export interface CompleteFundingSourceStripeCompletionDataInput {
  provider: 'stripe'
  paymentMethod: string
}

export type CompleteFundingSourceCompletionDataInput =
  CompleteFundingSourceStripeCompletionDataInput

/**
 * Input for {@link SudoVirtualCardsClient.completeFundingSource}.
 *
 * @property {string} id Identifier of the provisional funding source to be completed and provisioned.
 * @property {string} completionData JSON string of the completion data to be passed back to the service.
 * @property {boolean} updateCardFundingSource flag to indicate whether to update inactive card funding sources
 *  with a new funding source when a funding source is created.
 */
export interface CompleteFundingSourceInput {
  id: string
  completionData: CompleteFundingSourceCompletionDataInput
  updateCardFundingSource?: boolean
}

/**
 * Input for {@link SudoVirtualCardsClient.getFundingSource}.
 *
 * @property {string} id The identifier of the funding source to be retrieved.
 * @property {CachePolicy} cachePolicy Determines how the funding source will be fetched.
 */
export interface GetFundingSourceInput {
  id: string
  cachePolicy?: CachePolicy
}

/**
 * Input for {@link SudoVirtualCardsClient.listFundingSources}.
 *
 * @property {CachePolicy} cachePolicy Determines how the funding sources will be fetched.
 * @property {number} limit Number of items to return.  Will be defaulted if omitted.
 * @property {string} nextToken A token generated by a previous call.
 */
export interface ListFundingSourcesInput {
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
}

/**
 * Input for {@link ProvisionVirtualCardInput} billingAddress.
 *
 * @property {string} addressLine1 First line of the billing address.
 * @property {string} addressLine2 Optional - Second line of the billing address.
 * @property {string} city City of the billing address.
 * @property {string} state State of the billing address.
 * @property {string} postalCode Postal Code of the billing address.
 * @property {string} country Country of the billing address.
 */
export interface ProvisionVirtualCardBillingAddressInput {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

/**
 * Input for {@link SudoVirtualCardsClient.provisionVirtualCard}.
 *
 * @property {string[]} ownershipProofs Proof of sudo ownership for provisioning cards. The ownership proof must
 *  contain an audience of "sudoplatform.virtual-cards.virtual-card".
 * @property {string} fundingSourceId Identifier of the funding source backing the provisioned card.
 * @property {string} cardHolder Name to appear on the card.
 * @property {string} currency ISO Currency code to provision the card with.
 * @property {ProvisionVirtualCardBillingAddressInput} billingAddress Optional - Billing address of the card.
 * @property {string} clientRefId Optional - Identifier of the client.
 * @property {JSONValue} metadata Client side sealed arbitrary metadata object
 */
export interface ProvisionVirtualCardInput {
  ownershipProofs: string[]
  fundingSourceId: string
  cardHolder: string
  currency: string
  billingAddress?: ProvisionVirtualCardBillingAddressInput
  clientRefId?: string
  metadata?: Metadata

  /** @deprecated Specify as an alias property in metadata instead */
  alias?: string
}

/**
 * Input for {@link SudoVirtualCardsClient.updateVirtualCard}.
 *
 * To leave a property unchanged, leave it undefined.
 * To remove a property, set it to null.
 * To update a property, set it to the new value.
 *
 * @property {string} id Identifier of the card to update.
 * @property {number} expectedCardVersion Version of card to update. If specified, version must match existing version of card.
 * @property {string} cardHolder Updated card holder. Leave as existing to remain unchanged.
 * @property {string} billingAddress Updated billing address. To remove, set to undefined.
 * @property {JSONValue} metadata Client side sealed arbitrary metadata object
 */
export interface UpdateVirtualCardInput {
  id: string
  expectedCardVersion?: number
  cardHolder?: string
  billingAddress?: BillingAddress | null
  metadata?: Metadata | null
  /** @deprecated Use an alias property in metadata instead */
  alias?: string | null
}

/**
 * Input for {@link SudoVirtualCardsClient.cancelVirtualCard}
 *
 * @property {string} id Identifier of the card to cancel.
 */
export interface CancelVirtualCardInput {
  id: string
}

/**
 * Input for {@link SudoVirtualCardsClient.getProvisionalCard}.
 *
 * @property {string} id Identifier of the provisional card to get.
 * @property {CachePolicy} cachePolicy Cache Policy to use to access provisional card.
 */
export interface GetProvisionalCardInput {
  id: string
  cachePolicy?: CachePolicy
}

/**
 * Input for {@link SudoVirtualCardsClient.listProvisionalCards}.
 *
 * @property {CachePolicy} cachePolicy Cache Policy to use to access provisional cards.
 * @property {number} limit Number of cards to return.
 * @property {string} nextToken Paginated next token.
 */
export interface ListProvisionalCardsInput {
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
}

/**
 * Input for {@link SudoVirtualCardsClient.getVirtualCard}.
 *
 * @property {string} id Identifier of the virtual card to get.
 * @property {CachePolicy} cachePolicy Cache Policy to use to access virtual card.
 */
export interface GetVirtualCardInput {
  id: string
  cachePolicy?: CachePolicy
}

/**
 * Input for {@link SudoVirtualCardsClient.listVirtualCards}.
 *
 * @property {CachePolicy} cachePolicy Cache Policy to use to access virtual cards.
 * @property {number} limit Number of cards to return.
 * @property {string} nextToken Paginated next token.
 */
export interface ListVirtualCardsInput {
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
}

/**
 * Input for {@link SudoVirtualCardsClient.getTransaction}.
 *
 * @property {string} id Identifier of the transaction to get.
 * @property {CachePolicy} cachePolicy Cache Policy to use to access a transaction.
 */
export interface GetTransactionInput {
  id: string
  cachePolicy?: CachePolicy
}

/**
 * Input for {@link SudoVirtualCardsClient.listTransactionsByCardId}
 *
 * @property {string} cardId Identifier of the card to list for related transactions.
 * @property {CachePolicy} cachePolicy Cache Policy to use to access transactions.
 * @property {number} limit Number of transactions to return.
 * @property {string} nextToken Paginated next token.
 */
export interface ListTransactionsByCardIdInput {
  cardId: string
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
  dateRange?: DateRange
  sortOrder?: SortOrder
}

/**
 * Result for {@link SudoVirtualCardsClient#createKeysIfAbsent}
 *
 * @property {CreateKeyIfAbsentResult} symmetricKey
 *  Result of createKeysIfAbsent operation for the symmetric key
 * @property {CreateKeyIfAbsentResult} keyPair
 *  Result of createKeysIfAbsent operation for the key pair
 */
export interface CreateKeysIfAbsentResult {
  symmetricKey: CreateKeyIfAbsentResult
  keyPair: CreateKeyIfAbsentResult
}

/**
 * Sudo Platform Virtual Cards client API
 *
 * All methods should be expected to be able to throw the following
 * errors defined in `@sudoplatform/sudo-common`:
 *
 * @throws NotSignedInError
 *  User not signed in. Sign in before performing the operation.
 * @throws AccountLockedError
 *  Account has been locked. Contact support.
 * @throws ServiceError
 *  Transient error at the service. Try the operation again
 */
export interface SudoVirtualCardsClient {
  /**
   * Create key pair and secret key for use by the Virtual Cards Client if
   * they have not already been created.
   *
   * The key pair is used to register a public key with the service for the
   * encryption of virtual card and transaction details.
   *
   * The secret key is used for client side encryption of user specific
   * card metadata.
   *
   * @returns {CreateKeysIfAbsentResult}
   */
  createKeysIfAbsent(): Promise<CreateKeysIfAbsentResult>

  /**
   * Get the funding source client configuration.
   *
   * @returns {ProvisionalFundingSource} The configuration of the client funding source data.
   */
  getFundingSourceClientConfiguration(): Promise<
    FundingSourceClientConfiguration[]
  >

  /**
   * Setup the funding source.
   * @param {SetupFundingSourceInput} input Parameters used to setup the provisional funding source.
   * @returns {ProvisionalFundingSource} The provisional funding source.
   * @throws InsufficientEntitlementsError
   *   User has insufficient entitlements to setup a new funding source.
   * @throws {@link VelocityExceededError}
   *   Configured maximum rate of attempts to add a funding source has
   *   been exceeded or too many failed attempts have recently been made.
   *   Wait before retrying.
   */
  setupFundingSource(
    input: SetupFundingSourceInput,
  ): Promise<ProvisionalFundingSource>

  /**
   * Complete a provisional funding source.
   * @param {CompleteFundingSourceInput} input Parameters used to complete the funding source.
   * @returns {FundingSource} The funding source to be provisioned.
   * @throws {@link DuplicateFundingSourceError}
   *  User already has an active funding source matching the funding
   *  source being created.
   * @throws {@link FundingSourceCompletionDataInvalidError}
   *  Completion data provided does not match provisional funding
   *  source specified.
   * @throws {@link IdentityVerificationNotVerifiedError}
   *  Identity information associated with funding source does not
   *  sufficiently match identity information provided during identity
   *  verification.
   * @throws {@link ProvisionalFundingSourceNotFoundError}
   *  No provisional funding source with the ID specified could be found.
   * @throws {@link UnacceptableFundingSourceError}
   *  The funding source provided is not acceptable for use to fund virtual
   *  card transactions.
   */
  completeFundingSource(
    input: CompleteFundingSourceInput,
  ): Promise<FundingSource>

  /**
   * Get a funding source identified by id.
   *
   * @param {GetFundingSourceInput} input Parameters used to retrieve a funding source.
   * @returns {FundingSource | undefined} The funding source identified by id or undefined if the funding source
   *  cannot be found.
   *
   * @throws {@link FundingSourceNotFoundError}
   *   No funding source matching the specified ID could be found.
   */
  getFundingSource(
    input: GetFundingSourceInput,
  ): Promise<FundingSource | undefined>

  /**
   * Get a list of all created funding sources for the signed in user.
   *
   * @param {ListFundingSourcesInput} input Parameters used to retrieve a list of created funding sources.
   * @returns {ListOutput<FundingSource>} An array of funding sources or an empty array if no matching funding sources
   *  can be found.
   */
  listFundingSources(
    input?: ListFundingSourcesInput,
  ): Promise<ListOutput<FundingSource>>

  /**
   * Cancel a single funding source identified by id.
   *
   * @param {string} id The identifier of the funding source to cancel.
   * @returns {FundingSource} The funding source that was cancelled.
   *
   * @throws {@link FundingSourceNotFoundError}
   *   No funding source matching the specified ID could be found.
   */
  cancelFundingSource(id: string): Promise<FundingSource>

  /**
   * Provision a virtual card.
   * @param {ProvisionVirtualCardInput} input Parameters used to provision a virtual card.
   *
   * @returns {ProvisionalFundingSource} The card that is being provisioned. Please poll the card via the list methods to access the card.
   * @throws {@link FundingSourceNotFoundError}
   *   No funding source matching the specified ID could be found.
   * @throws {@link FundingSourceNotActiveError}
   *   The funding source matching the specified ID is not active.
   * @throws InsufficientEntitlementsError
   *   User has insufficient entitlements to setup a new virtual card.
   * @throws {@link VelocityExceededError}
   *   Configured maximum rate of attempts to add a virtual card has
   *   been exceeded. Wait before retrying.
   */
  provisionVirtualCard(
    input: ProvisionVirtualCardInput,
  ): Promise<ProvisionalVirtualCard>

  /**
   * Update a virtual card.
   * @param input Parameters used to update a virtual card.
   *
   * @returns {VirtualCard} The virtual card that was updated.
   *
   * @throws {@link CardNotFoundError}
   *  No virtual card matching the ID specified could be found
   * @throws {@link CardStateError}
   *  Card not in ISSUED state. It must be in ISSUED state in order
   *  to update.
   */
  updateVirtualCard(
    input: UpdateVirtualCardInput,
  ): Promise<APIResult<VirtualCard, VirtualCardSealedAttributes>>

  /**
   * Cancel a virtual card.
   * @param input Parameters used to cancel a virtual card.
   *
   * @returns {string} The identifier of the card that was just cancelled.
   *
   * @throws {@link CardNotFoundError}
   *  No virtual card matching the ID specified could be found
   */
  cancelVirtualCard(
    input: CancelVirtualCardInput,
  ): Promise<APIResult<VirtualCard, VirtualCardSealedAttributes>>

  /**
   * Get a provisional card.
   * @param input Parameters used to get a provisional card.
   *
   * @returns {ProvisionalVirtualCard | undefined} The card that is being queried, or undefined if not found.
   */
  getProvisionalCard(
    input: GetProvisionalCardInput,
  ): Promise<ProvisionalVirtualCard | undefined>

  /**
   * List provisional cards.
   * @param input Parameters used to list provisional cards.
   *
   * @returns {ListProvisionalCardsResults} Result of the provisional card list.
   */
  listProvisionalCards(
    input?: ListProvisionalCardsInput,
  ): Promise<ListProvisionalCardsResults>

  /**
   * Get a virtual card.
   * @param input Parameters used to get a virtual card.
   *
   * @returns {ProvisionalVirtualCard | undefined} The card that is being queried, or undefined if not found.
   */
  getVirtualCard(input: GetVirtualCardInput): Promise<VirtualCard | undefined>

  /**
   * List virtual cards.
   * @param input Parameters used to list virtual cards.
   *
   * @returns {ListProvisionalCardsResults} Result of the virtual card list.
   */
  listVirtualCards(
    input?: ListVirtualCardsInput,
  ): Promise<ListVirtualCardsResults>

  /**
   * Get a transaction.
   * @param input Parameters used to get a transaction.
   *
   * @returns {Transaction | undefined} The transaction that is being queried, or undefined if not found.
   */
  getTransaction(input: GetTransactionInput): Promise<Transaction | undefined>

  /**
   * List transactions.
   * @param input Parameters used for list transactions.
   *
   * @returns {ListTransactionsResults} Results of the transaction list.
   */
  listTransactionsByCardId(
    input: ListTransactionsByCardIdInput,
  ): Promise<ListTransactionsResults>

  /**
   * Get the configuration data for the virtual cards service.
   *
   * @returns {VirtualCardsConfig} The configuration data for the virtual cards service.
   */
  getVirtualCardsConfig(): Promise<VirtualCardsConfig>

  /**
   * Removes any cached data maintained by this client.
   */
  reset(): Promise<void>
}

export type SudoVirtualCardsClientOptions = {
  /** Sudo User client to use. No default */
  sudoUserClient: SudoUserClient

  /** SudoCryptoProvider to use. Default is to create a WebSudoCryptoProvider */
  sudoCryptoProvider?: SudoCryptoProvider
}

export class DefaultSudoVirtualCardsClient implements SudoVirtualCardsClient {
  private readonly apiClient: ApiClient
  private readonly configurationDataService: DefaultVirtualCardsConfigService
  private readonly fundingSourceService: DefaultFundingSourceService
  private readonly sudoUserService: SudoUserService
  private readonly virtualCardService: VirtualCardService
  private readonly transactionService: TransactionService
  private readonly keyService: KeyService
  private readonly deviceKeyWorker: DeviceKeyWorker
  private readonly transactionWorker: TransactionWorker
  private readonly keyManager: SudoKeyManager
  private readonly cryptoProvider: SudoCryptoProvider
  private readonly sudoUserClient: SudoUserClient

  private readonly log = new DefaultLogger(this.constructor.name)
  private readonly serialise = new Mutex()

  public constructor(opts: SudoVirtualCardsClientOptions) {
    const privateOptions = opts as
      | SudoVirtualCardsClientPrivateOptions
      | undefined
    this.apiClient = privateOptions?.apiClient ?? new ApiClient()
    this.sudoUserClient = opts.sudoUserClient
    this.cryptoProvider =
      opts.sudoCryptoProvider ??
      new WebSudoCryptoProvider(
        'SudoVirtualCardsClient',
        'com.sudoplatform.appservicename',
      )
    this.keyManager = new DefaultSudoKeyManager(this.cryptoProvider)
    this.deviceKeyWorker = new DefaultDeviceKeyWorker(
      this.keyManager,
      this.sudoUserClient,
    )
    this.transactionWorker = new DefaultTransactionWorker(this.deviceKeyWorker)

    this.keyService = new DefaultKeyService(
      this.apiClient,
      this.deviceKeyWorker,
    )
    this.configurationDataService = new DefaultVirtualCardsConfigService(
      this.apiClient,
    )
    this.fundingSourceService = new DefaultFundingSourceService(this.apiClient)
    this.virtualCardService = new DefaultVirtualCardService(
      this.apiClient,
      this.deviceKeyWorker,
      this.transactionWorker,
    )
    this.transactionService = new DefaultTransactionService(
      this.apiClient,
      this.transactionWorker,
    )
    this.sudoUserService = new DefaultSudoUserService(this.sudoUserClient)
    if (!DefaultConfigurationManager.getInstance().getConfigSet('vcService')) {
      throw new VirtualCardsServiceConfigNotFoundError()
    }
  }

  /**
   * Create key pair and secret key for use by the Virtual Cards Client if
   * they have not already been created.
   *
   * The key pair is used to register a public key with the service for the
   * encryption of virtual card and transaction details.
   *
   * The secret key is used for client side encryption of user specific
   * card metadata.
   */
  public async createKeysIfAbsent(): Promise<CreateKeysIfAbsentResult> {
    return this.serialise.runExclusive(async () => {
      const useCase = new CreateKeysIfAbsentUseCase(
        this.sudoUserClient,
        this.keyService,
      )

      return await useCase.execute()
    })
  }

  public async getFundingSourceClientConfiguration(): Promise<
    FundingSourceClientConfiguration[]
  > {
    const useCase = new GetFundingSourceClientConfigurationUseCase(
      this.fundingSourceService,
    )
    const rawData = await useCase.execute()
    const clientConfig = JSON.parse(Base64.decodeString(rawData)) as {
      fundingSourceTypes: FundingSourceClientConfiguration[]
    }
    return clientConfig.fundingSourceTypes
  }

  public async setupFundingSource(
    input: SetupFundingSourceInput,
  ): Promise<ProvisionalFundingSource> {
    return this.serialise.runExclusive(async () => {
      const useCase = new SetupFundingSourceUseCase(
        this.fundingSourceService,
        this.sudoUserService,
      )
      const result = await useCase.execute(input)
      return ProvisionalFundingSourceApiTransformer.transformEntity(result)
    })
  }

  public async completeFundingSource(
    input: CompleteFundingSourceInput,
  ): Promise<FundingSource> {
    return this.serialise.runExclusive(async () => {
      const useCase = new CompleteFundingSourceUseCase(
        this.fundingSourceService,
        this.sudoUserClient,
      )
      return await useCase.execute({
        ...input,
        completionData: { ...input.completionData, version: 1 },
      })
    })
  }

  public async getFundingSource({
    id,
    cachePolicy,
  }: GetFundingSourceInput): Promise<FundingSource | undefined> {
    this.log.debug(this.getFundingSource.name, {
      id,
      cachePolicy,
    })
    const useCase = new GetFundingSourceUseCase(
      this.fundingSourceService,
      this.sudoUserService,
    )
    const result = await useCase.execute({
      id,
      cachePolicy,
    })
    return result
  }

  public async listFundingSources(
    input?: ListFundingSourcesInput,
  ): Promise<ListOutput<FundingSource>> {
    const cachePolicy = input?.cachePolicy
    const limit = input?.limit
    const nextToken = input?.nextToken
    this.log.debug(this.listFundingSources.name, {
      cachePolicy,
      limit,
      nextToken,
    })
    const useCase = new ListFundingSourcesUseCase(
      this.fundingSourceService,
      this.sudoUserService,
    )
    const { fundingSources, nextToken: resultNextToken } =
      await useCase.execute({
        cachePolicy,
        limit,
        nextToken,
      })
    return {
      items: fundingSources,
      nextToken: resultNextToken,
    }
  }

  public async cancelFundingSource(id: string): Promise<FundingSource> {
    return this.serialise.runExclusive(async () => {
      this.log.debug(this.cancelFundingSource.name, {
        id,
      })
      const useCase = new CancelFundingSourceUseCase(
        this.fundingSourceService,
        this.sudoUserService,
      )
      return await useCase.execute(id)
    })
  }

  public async provisionVirtualCard(
    input: ProvisionVirtualCardInput,
  ): Promise<ProvisionalVirtualCard> {
    return this.serialise.runExclusive(async () => {
      const useCase = new ProvisionVirtualCardUseCase(
        this.virtualCardService,
        this.sudoUserClient,
      )
      return await useCase.execute(input)
    })
  }

  public async updateVirtualCard(
    input: UpdateVirtualCardInput,
  ): Promise<APIResult<VirtualCard, VirtualCardSealedAttributes>> {
    return this.serialise.runExclusive(async () => {
      const useCase = new UpdateVirtualCardUseCase(
        this.virtualCardService,
        this.sudoUserService,
      )
      return await useCase.execute(input)
    })
  }

  public async cancelVirtualCard(
    input: CancelVirtualCardInput,
  ): Promise<APIResult<VirtualCard, VirtualCardSealedAttributes>> {
    return this.serialise.runExclusive(async () => {
      const useCase = new CancelVirtualCardUseCase(
        this.virtualCardService,
        this.sudoUserService,
      )
      return await useCase.execute(input)
    })
  }

  public async getProvisionalCard({
    id,
    cachePolicy,
  }: GetProvisionalCardInput): Promise<ProvisionalVirtualCard | undefined> {
    return this.serialise.runExclusive(async () => {
      const useCase = new GetProvisionalCardUseCase(
        this.virtualCardService,
        this.sudoUserService,
      )
      return await useCase.execute({ id, cachePolicy })
    })
  }

  async listProvisionalCards(
    input: ListProvisionalCardsInput,
  ): Promise<ListProvisionalCardsResults> {
    return this.serialise.runExclusive(async () => {
      const useCase = new ListProvisionalCardsUseCase(
        this.virtualCardService,
        this.sudoUserService,
      )
      return await useCase.execute(input)
    })
  }

  async getVirtualCard({
    id,
    cachePolicy,
  }: GetVirtualCardInput): Promise<VirtualCard | undefined> {
    return this.serialise.runExclusive(async () => {
      const useCase = new GetVirtualCardUseCase(
        this.virtualCardService,
        this.sudoUserService,
      )
      return await useCase.execute({ id, cachePolicy })
    })
  }

  async listVirtualCards(
    input: ListVirtualCardsInput,
  ): Promise<ListVirtualCardsResults> {
    return this.serialise.runExclusive(async () => {
      const useCase = new ListVirtualCardsUseCase(
        this.virtualCardService,
        this.sudoUserService,
      )
      return await useCase.execute(input)
    })
  }

  async getTransaction(
    input: GetTransactionInput,
  ): Promise<Transaction | undefined> {
    return this.serialise.runExclusive(async () => {
      const useCase = new GetTransactionUseCase(
        this.transactionService,
        this.sudoUserService,
      )
      return await useCase.execute(input)
    })
  }

  async listTransactionsByCardId(
    input: ListTransactionsByCardIdInput,
  ): Promise<ListTransactionsResults> {
    return this.serialise.runExclusive(async () => {
      const useCase = new ListTransactionsByCardIdUseCase(
        this.transactionService,
        this.sudoUserService,
      )
      return await useCase.execute(input)
    })
  }

  async getVirtualCardsConfig(): Promise<VirtualCardsConfig> {
    const useCase = new GetVirtualCardsConfigUseCase(
      this.configurationDataService,
      this.sudoUserService,
    )
    return await useCase.execute()
  }

  async reset(): Promise<void> {
    await this.keyManager.removeAllKeys()
  }
}
