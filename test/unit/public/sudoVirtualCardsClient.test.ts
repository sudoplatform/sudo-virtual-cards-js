/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Base64,
  CachePolicy,
  DefaultConfigurationManager,
  DefaultSudoKeyManager,
  ListOperationResultStatus,
  SudoCryptoProvider,
} from '@sudoplatform/sudo-common'
import { SudoProfilesClient } from '@sudoplatform/sudo-profiles'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { WebSudoCryptoProvider } from '@sudoplatform/sudo-web-crypto-provider'
import {
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito'
import { v4 } from 'uuid'
import {
  BankAccountType,
  FundingSource,
  FundingSourceRequiresUserInteractionError,
  SandboxPlaidData,
  TransactionType,
} from '../../../src'
import { ApiClient } from '../../../src/private/data/common/apiClient'
import { SudoVirtualCardsClientPrivateOptions } from '../../../src/private/data/common/privateSudoVirtualCardsClientOptions'
import { DefaultFundingSourceService } from '../../../src/private/data/fundingSource/defaultFundingSourceService'
import { VirtualCardBillingAddressEntity } from '../../../src/private/domain/entities/virtualCard/virtualCardEntity'
import { CancelFundingSourceUseCase } from '../../../src/private/domain/use-cases/fundingSource/cancelFundingSourceUseCase'
import { CompleteFundingSourceUseCase } from '../../../src/private/domain/use-cases/fundingSource/completeFundingSourceUseCase'
import { GetFundingSourceClientConfigurationUseCase } from '../../../src/private/domain/use-cases/fundingSource/getFundingSourceClientConfigurationUseCase'
import { GetFundingSourceUseCase } from '../../../src/private/domain/use-cases/fundingSource/getFundingSourceUseCase'
import { ListFundingSourcesUseCase } from '../../../src/private/domain/use-cases/fundingSource/listFundingSourcesUseCase'
import { RefreshFundingSourceUseCase } from '../../../src/private/domain/use-cases/fundingSource/refreshFundingSourceUseCase'
import { SandboxGetPlaidDataUseCase } from '../../../src/private/domain/use-cases/fundingSource/sandboxGetPlaidDataUseCase'
import { SandboxSetFundingSourceToRequireRefreshUseCase } from '../../../src/private/domain/use-cases/fundingSource/sandboxSetFundingSourceToRequireRefreshUseCase'
import { SetupFundingSourceUseCase } from '../../../src/private/domain/use-cases/fundingSource/setupFundingSourceUseCase'
import { SubscribeToFundingSourceChangesUseCase } from '../../../src/private/domain/use-cases/fundingSource/subscribeToFundingSourceChangesUseCase'
import { UnsubscribeFromFundingSourceChangesUseCase } from '../../../src/private/domain/use-cases/fundingSource/unsubscribeFromFundingSourceChangesUseCase'
import { CreateKeysIfAbsentUseCase } from '../../../src/private/domain/use-cases/key/createKeysIfAbsent'
import { GetTransactionUseCase } from '../../../src/private/domain/use-cases/transaction/getTransactionUseCase'
import { ListTransactionsByCardIdAndTypeUseCase } from '../../../src/private/domain/use-cases/transaction/listTransactionsByCardIdAndTypeUseCase'
import { ListTransactionsByCardIdUseCase } from '../../../src/private/domain/use-cases/transaction/listTransactionsByCardIdUseCase'
import { ListTransactionsUseCase } from '../../../src/private/domain/use-cases/transaction/listTransactionsUseCase'
import { CancelVirtualCardUseCase } from '../../../src/private/domain/use-cases/virtualCard/cancelVirtualCardUseCase'
import { GetProvisionalCardUseCase } from '../../../src/private/domain/use-cases/virtualCard/getProvisionalCardUseCase'
import { GetVirtualCardUseCase } from '../../../src/private/domain/use-cases/virtualCard/getVirtualCardUseCase'
import { ListProvisionalCardsUseCase } from '../../../src/private/domain/use-cases/virtualCard/listProvisionalCardsUseCase'
import { ListVirtualCardsUseCase } from '../../../src/private/domain/use-cases/virtualCard/listVirtualCardsUseCase'
import { ProvisionVirtualCardUseCase } from '../../../src/private/domain/use-cases/virtualCard/provisionVirtualCardUseCase'
import { UpdateVirtualCardUseCase } from '../../../src/private/domain/use-cases/virtualCard/updateVirtualCardUseCase'
import {
  DefaultSudoVirtualCardsClient,
  SandboxGetPlaidDataInput,
  SandboxSetFundingSourceToRequireRefreshInput,
  SudoVirtualCardsClient,
} from '../../../src/public/sudoVirtualCardsClient'
import { APIResultStatus } from '../../../src/public/typings/apiResult'
import { CreateKeysIfAbsentResult } from '../../../src/public/typings/createKeysIfAbsentResult'
import {
  CheckoutBankAccountRefreshFundingSourceInteractionData,
  FundingSourceType,
} from '../../../src/public/typings/fundingSource'
import { SortOrder } from '../../../src/public/typings/sortOrder'
import { ApiDataFactory } from '../data-factory/api'
import { EntityDataFactory } from '../data-factory/entity'

DefaultConfigurationManager.getInstance().setConfig(
  JSON.stringify({
    vcService: {
      apiUrl: 'https://dummy.us-east-1.amazonaws.com/graphql',
      region: 'us-east-1',
    },
  }),
)

// Constructor mocks

jest.mock('../../../src/private/data/fundingSource/defaultFundingSourceService')
const JestMockDefaultFundingSourceService =
  DefaultFundingSourceService as jest.MockedClass<
    typeof DefaultFundingSourceService
  >
jest.mock('../../../src/private/data/common/apiClient')

const JestMockApiClient = ApiClient as jest.MockedClass<typeof ApiClient>
jest.mock('@sudoplatform/sudo-web-crypto-provider')
const JestMockWebSudoCryptoProvider = WebSudoCryptoProvider as jest.MockedClass<
  typeof WebSudoCryptoProvider
>

// Use case Mocks
jest.mock('../../../src/private/domain/use-cases/key/createKeysIfAbsent')
const JestMockCreateKeysIfAbsentUseCase =
  CreateKeysIfAbsentUseCase as jest.MockedClass<
    typeof CreateKeysIfAbsentUseCase
  >
jest.mock(
  '../../../src/private/domain/use-cases/fundingSource/setupFundingSourceUseCase',
)
const JestMockSetupFundingSourceUseCase =
  SetupFundingSourceUseCase as jest.MockedClass<
    typeof SetupFundingSourceUseCase
  >
jest.mock(
  '../../../src/private/domain/use-cases/fundingSource/getFundingSourceClientConfigurationUseCase',
)
const JestMockGetFundingSourceClientConfigurationUseCase =
  GetFundingSourceClientConfigurationUseCase as jest.MockedClass<
    typeof GetFundingSourceClientConfigurationUseCase
  >
jest.mock(
  '../../../src/private/domain/use-cases/fundingSource/completeFundingSourceUseCase',
)
const JestMockCompleteFundingSourceUseCase =
  CompleteFundingSourceUseCase as jest.MockedClass<
    typeof CompleteFundingSourceUseCase
  >
jest.mock(
  '../../../src/private/domain/use-cases/fundingSource/refreshFundingSourceUseCase',
)
const JestMockRefreshFundingSourceUseCase =
  RefreshFundingSourceUseCase as jest.MockedClass<
    typeof RefreshFundingSourceUseCase
  >
jest.mock(
  '../../../src/private/domain/use-cases/fundingSource/subscribeToFundingSourceChangesUseCase',
)
const JestMockSubscribeToFundingSourceChangesUseCase =
  SubscribeToFundingSourceChangesUseCase as jest.MockedClass<
    typeof SubscribeToFundingSourceChangesUseCase
  >
jest.mock(
  '../../../src/private/domain/use-cases/fundingSource/unsubscribeFromFundingSourceChangesUseCase',
)
const JestMockUnsubscribeFromFundingSourceChangesUseCase =
  UnsubscribeFromFundingSourceChangesUseCase as jest.MockedClass<
    typeof UnsubscribeFromFundingSourceChangesUseCase
  >
jest.mock(
  '../../../src/private/domain/use-cases/fundingSource/getFundingSourceUseCase',
)
const JestMockGetFundingSourceUseCase =
  GetFundingSourceUseCase as jest.MockedClass<typeof GetFundingSourceUseCase>
jest.mock(
  '../../../src/private/domain/use-cases/fundingSource/listFundingSourcesUseCase',
)
const JestMockListFundingSourcesUseCase =
  ListFundingSourcesUseCase as jest.MockedClass<
    typeof ListFundingSourcesUseCase
  >
jest.mock(
  '../../../src/private/domain/use-cases/fundingSource/cancelFundingSourceUseCase',
)
const JestMockCancelFundingSourceUseCase =
  CancelFundingSourceUseCase as jest.MockedClass<
    typeof CancelFundingSourceUseCase
  >
jest.mock(
  '../../../src/private/domain/use-cases/virtualCard/provisionVirtualCardUseCase',
)
const JestMockProvisionVirtualCardUseCase =
  ProvisionVirtualCardUseCase as jest.MockedClass<
    typeof ProvisionVirtualCardUseCase
  >
jest.mock(
  '../../../src/private/domain/use-cases/virtualCard/getProvisionalCardUseCase',
)
const JestMockGetProvisionalCardUseCase =
  GetProvisionalCardUseCase as jest.MockedClass<
    typeof GetProvisionalCardUseCase
  >
jest.mock(
  '../../../src/private/domain/use-cases/virtualCard/listProvisionalCardsUseCase',
)
const JestMockListProvisionalCardsUseCase =
  ListProvisionalCardsUseCase as jest.MockedClass<
    typeof ListProvisionalCardsUseCase
  >
jest.mock(
  '../../../src/private/domain/use-cases/virtualCard/getVirtualCardUseCase',
)
const JestMockGetVirtualCardUseCase = GetVirtualCardUseCase as jest.MockedClass<
  typeof GetVirtualCardUseCase
>
jest.mock(
  '../../../src/private/domain/use-cases/virtualCard/listVirtualCardsUseCase',
)
const JestMockListVirtualCardsUseCase =
  ListVirtualCardsUseCase as jest.MockedClass<typeof ListVirtualCardsUseCase>
jest.mock(
  '../../../src/private/domain/use-cases/virtualCard/updateVirtualCardUseCase',
)
const JestMockUpdateVirtualCardUseCase =
  UpdateVirtualCardUseCase as jest.MockedClass<typeof UpdateVirtualCardUseCase>

jest.mock(
  '../../../src/private/domain/use-cases/virtualCard/cancelVirtualCardUseCase',
)
const JestMockCancelVirtualCardUseCase =
  CancelVirtualCardUseCase as jest.MockedClass<typeof CancelVirtualCardUseCase>

jest.mock(
  '../../../src/private/domain/use-cases/transaction/getTransactionUseCase',
)
const JestMockGetTransactionUseCase = GetTransactionUseCase as jest.MockedClass<
  typeof GetTransactionUseCase
>

jest.mock(
  '../../../src/private/domain/use-cases/transaction/listTransactionsUseCase',
)
const JestMockListTransactionsUseCase =
  ListTransactionsUseCase as jest.MockedClass<typeof ListTransactionsUseCase>

jest.mock(
  '../../../src/private/domain/use-cases/transaction/listTransactionsByCardIdUseCase',
)
const JestMockListTransactionsByCardIdUseCase =
  ListTransactionsByCardIdUseCase as jest.MockedClass<
    typeof ListTransactionsByCardIdUseCase
  >

jest.mock(
  '../../../src/private/domain/use-cases/transaction/listTransactionsByCardIdAndTypeUseCase',
)
const JestMockListTransactionsByCardIdAndTypeUseCase =
  ListTransactionsByCardIdAndTypeUseCase as jest.MockedClass<
    typeof ListTransactionsByCardIdAndTypeUseCase
  >

jest.mock(
  '../../../src/private/domain/use-cases/fundingSource/sandboxGetPlaidDataUseCase',
)
const JestMockSandboxGetPlaidDataUseCase =
  SandboxGetPlaidDataUseCase as jest.MockedClass<
    typeof SandboxGetPlaidDataUseCase
  >

jest.mock(
  '../../../src/private/domain/use-cases/fundingSource/sandboxSetFundingSourceToRequireRefreshUseCase',
)
const JestMockSandboxSetFundingSourceToRequireRefreshUseCase =
  SandboxSetFundingSourceToRequireRefreshUseCase as jest.MockedClass<
    typeof SandboxSetFundingSourceToRequireRefreshUseCase
  >

describe('SudoVirtualCardsClient Test Suite', () => {
  // Opt Mocks
  const mockSudoUserClient = mock<SudoUserClient>()
  const mockSudoProfilesClient = mock<SudoProfilesClient>()
  const mockSudoCryptoProvider = mock<SudoCryptoProvider>()
  const mockSudoKeyManager = mock<DefaultSudoKeyManager>()
  const mockApiClient = mock<ApiClient>()

  // Mocks generated inside of constructor
  const mockFundingSourceService = mock<DefaultFundingSourceService>()

  // Use case Mocks
  const mockCreateKeysIfAbsentUseCase = mock<CreateKeysIfAbsentUseCase>()
  const mockSetupFundingSourceUseCase = mock<SetupFundingSourceUseCase>()
  const mockGetFundingSourceClientConfigurationUseCase =
    mock<GetFundingSourceClientConfigurationUseCase>()
  const mockCompleteFundingSourceUseCase = mock<CompleteFundingSourceUseCase>()
  const mockRefreshFundingSourceUseCase = mock<RefreshFundingSourceUseCase>()
  const mockSubscribeToFundingSourceChangesUseCase =
    mock<SubscribeToFundingSourceChangesUseCase>()
  const mockUnsubscribeFromFundingSourceChangesUseCase =
    mock<UnsubscribeFromFundingSourceChangesUseCase>()
  const mockGetFundingSourceUseCase = mock<GetFundingSourceUseCase>()
  const mockListFundingSourcesUseCase = mock<ListFundingSourcesUseCase>()
  const mockCancelFundingSourceUseCase = mock<CancelFundingSourceUseCase>()
  const mockProvisionVirtualCardUseCase = mock<ProvisionVirtualCardUseCase>()
  const mockGetProvisionalCardUseCase = mock<GetProvisionalCardUseCase>()
  const mockListProvisionalCardsUseCase = mock<ListProvisionalCardsUseCase>()
  const mockGetVirtualCardUseCase = mock<GetVirtualCardUseCase>()
  const mockListVirtualCardsUseCase = mock<ListVirtualCardsUseCase>()
  const mockUpdateVirtualCardUseCase = mock<UpdateVirtualCardUseCase>()
  const mockCancelVirtualCardUseCase = mock<CancelVirtualCardUseCase>()
  const mockGetTransactionUseCase = mock<GetTransactionUseCase>()
  const mockListTransactionsUseCase = mock<ListTransactionsUseCase>()
  const mockListTransactionsByCardIdUseCase =
    mock<ListTransactionsByCardIdUseCase>()
  const mockListTransactionsByCardIdAndTypeUseCase =
    mock<ListTransactionsByCardIdAndTypeUseCase>()
  const mockSandboxGetPlaidDataUseCase = mock<SandboxGetPlaidDataUseCase>()
  const mockSandboxSetFundingSourceToRequireRefreshUseCase =
    mock<SandboxSetFundingSourceToRequireRefreshUseCase>()

  let instanceUnderTest: SudoVirtualCardsClient

  const resetMocks = (): void => {
    reset(mockSudoUserClient)
    reset(mockSudoProfilesClient)
    reset(mockSudoCryptoProvider)
    reset(mockSudoKeyManager)
    reset(mockApiClient)
    reset(mockFundingSourceService)

    reset(mockCreateKeysIfAbsentUseCase)
    reset(mockSetupFundingSourceUseCase)
    reset(mockGetFundingSourceClientConfigurationUseCase)
    reset(mockCompleteFundingSourceUseCase)
    reset(mockRefreshFundingSourceUseCase)
    reset(mockSubscribeToFundingSourceChangesUseCase)
    reset(mockUnsubscribeFromFundingSourceChangesUseCase)
    reset(mockGetFundingSourceUseCase)
    reset(mockListFundingSourcesUseCase)
    reset(mockCancelFundingSourceUseCase)
    reset(mockProvisionVirtualCardUseCase)
    reset(mockGetProvisionalCardUseCase)
    reset(mockListProvisionalCardsUseCase)
    reset(mockGetVirtualCardUseCase)
    reset(mockListVirtualCardsUseCase)
    reset(mockUpdateVirtualCardUseCase)
    reset(mockCancelVirtualCardUseCase)
    reset(mockGetTransactionUseCase)
    reset(mockListTransactionsUseCase)
    reset(mockListTransactionsByCardIdUseCase)
    reset(mockListTransactionsByCardIdAndTypeUseCase)
    reset(mockSandboxGetPlaidDataUseCase)
    reset(mockSandboxSetFundingSourceToRequireRefreshUseCase)

    JestMockDefaultFundingSourceService.mockClear()
    JestMockApiClient.mockClear()
    JestMockWebSudoCryptoProvider.mockClear()

    JestMockCreateKeysIfAbsentUseCase.mockClear()
    JestMockSetupFundingSourceUseCase.mockClear()
    JestMockGetFundingSourceClientConfigurationUseCase.mockClear()
    JestMockCompleteFundingSourceUseCase.mockClear()
    JestMockRefreshFundingSourceUseCase.mockClear()
    JestMockSubscribeToFundingSourceChangesUseCase.mockClear()
    JestMockUnsubscribeFromFundingSourceChangesUseCase.mockClear()
    JestMockGetFundingSourceUseCase.mockClear()
    JestMockListFundingSourcesUseCase.mockClear()
    JestMockCancelFundingSourceUseCase.mockClear()
    JestMockProvisionVirtualCardUseCase.mockClear()
    JestMockGetProvisionalCardUseCase.mockClear()
    JestMockListProvisionalCardsUseCase.mockClear()
    JestMockGetVirtualCardUseCase.mockClear()
    JestMockListVirtualCardsUseCase.mockClear()
    JestMockUpdateVirtualCardUseCase.mockClear()
    JestMockCancelVirtualCardUseCase.mockClear()
    JestMockGetTransactionUseCase.mockClear()
    JestMockListTransactionsUseCase.mockClear()
    JestMockListTransactionsByCardIdUseCase.mockClear()
    JestMockListTransactionsByCardIdAndTypeUseCase.mockClear()

    JestMockDefaultFundingSourceService.mockImplementation(() =>
      instance(mockFundingSourceService),
    )
    JestMockApiClient.mockImplementation(() => instance(mockApiClient))

    JestMockCreateKeysIfAbsentUseCase.mockImplementation(() =>
      instance(mockCreateKeysIfAbsentUseCase),
    )
    JestMockSetupFundingSourceUseCase.mockImplementation(() =>
      instance(mockSetupFundingSourceUseCase),
    )
    JestMockGetFundingSourceClientConfigurationUseCase.mockImplementation(() =>
      instance(mockGetFundingSourceClientConfigurationUseCase),
    )
    JestMockCompleteFundingSourceUseCase.mockImplementation(() =>
      instance(mockCompleteFundingSourceUseCase),
    )
    JestMockRefreshFundingSourceUseCase.mockImplementation(() =>
      instance(mockRefreshFundingSourceUseCase),
    )
    JestMockSubscribeToFundingSourceChangesUseCase.mockImplementation(() =>
      instance(mockSubscribeToFundingSourceChangesUseCase),
    )
    JestMockUnsubscribeFromFundingSourceChangesUseCase.mockImplementation(() =>
      instance(mockUnsubscribeFromFundingSourceChangesUseCase),
    )
    JestMockGetFundingSourceUseCase.mockImplementation(() =>
      instance(mockGetFundingSourceUseCase),
    )
    JestMockListFundingSourcesUseCase.mockImplementation(() =>
      instance(mockListFundingSourcesUseCase),
    )
    JestMockCancelFundingSourceUseCase.mockImplementation(() =>
      instance(mockCancelFundingSourceUseCase),
    )
    JestMockProvisionVirtualCardUseCase.mockImplementation(() =>
      instance(mockProvisionVirtualCardUseCase),
    )
    JestMockGetProvisionalCardUseCase.mockImplementation(() =>
      instance(mockGetProvisionalCardUseCase),
    )
    JestMockListProvisionalCardsUseCase.mockImplementation(() =>
      instance(mockListProvisionalCardsUseCase),
    )
    JestMockGetVirtualCardUseCase.mockImplementation(() =>
      instance(mockGetVirtualCardUseCase),
    )
    JestMockListVirtualCardsUseCase.mockImplementation(() =>
      instance(mockListVirtualCardsUseCase),
    )
    JestMockUpdateVirtualCardUseCase.mockImplementation(() =>
      instance(mockUpdateVirtualCardUseCase),
    )
    JestMockCancelVirtualCardUseCase.mockImplementation(() =>
      instance(mockCancelVirtualCardUseCase),
    )
    JestMockGetTransactionUseCase.mockImplementation(() =>
      instance(mockGetTransactionUseCase),
    )
    JestMockListTransactionsUseCase.mockImplementation(() =>
      instance(mockListTransactionsUseCase),
    )
    JestMockListTransactionsByCardIdUseCase.mockImplementation(() =>
      instance(mockListTransactionsByCardIdUseCase),
    )
    JestMockListTransactionsByCardIdAndTypeUseCase.mockImplementation(() =>
      instance(mockListTransactionsByCardIdAndTypeUseCase),
    )
    JestMockSandboxGetPlaidDataUseCase.mockImplementation(() =>
      instance(mockSandboxGetPlaidDataUseCase),
    )
    JestMockSandboxSetFundingSourceToRequireRefreshUseCase.mockImplementation(
      () => instance(mockSandboxSetFundingSourceToRequireRefreshUseCase),
    )
  }

  beforeEach(() => {
    resetMocks()
    const options: SudoVirtualCardsClientPrivateOptions = {
      apiClient: instance(mockApiClient),
      sudoUserClient: instance(mockSudoUserClient),
      sudoKeyManager: instance(mockSudoKeyManager),
    }
    instanceUnderTest = new DefaultSudoVirtualCardsClient(options)
  })

  describe('constructor', () => {
    beforeEach(() => {
      resetMocks()
    })
    it('constructs itself correctly', () => {
      new DefaultSudoVirtualCardsClient({
        sudoUserClient: instance(mockSudoUserClient),
      })
      expect(JestMockApiClient).toHaveBeenCalledTimes(1)
      expect(JestMockDefaultFundingSourceService).toHaveBeenCalledTimes(1)
    })
  })

  describe('createKeysIfAbsent', () => {
    const result: CreateKeysIfAbsentResult = {
      symmetricKey: { created: true, keyId: 'symmetric-key' },
      keyPair: { created: true, keyId: 'key-pair' },
    }

    beforeEach(() => {
      when(mockCreateKeysIfAbsentUseCase.execute()).thenResolve(result)
    })

    it('generates use case', async () => {
      await instanceUnderTest.createKeysIfAbsent()
      expect(JestMockCreateKeysIfAbsentUseCase).toHaveBeenCalledTimes(1)
    })

    it('calls use case as expected', async () => {
      await expect(instanceUnderTest.createKeysIfAbsent()).resolves.toEqual(
        result,
      )
      verify(mockCreateKeysIfAbsentUseCase.execute()).once()
    })
  })

  describe('getFundingSourceClientConfiguration', () => {
    const result: string = Base64.encodeString(
      JSON.stringify({
        fundingSourceTypes: [
          {
            type: 'stripe',
            version: 1,
            apiKey: 'dummyApiKey',
          },
        ],
      }),
    )

    beforeEach(() => {
      when(
        mockGetFundingSourceClientConfigurationUseCase.execute(),
      ).thenResolve(result)
    })

    it('generates use case', async () => {
      await instanceUnderTest.getFundingSourceClientConfiguration()
      expect(
        JestMockGetFundingSourceClientConfigurationUseCase,
      ).toHaveBeenCalledTimes(1)
    })

    it('calls use case as expected', async () => {
      await instanceUnderTest.getFundingSourceClientConfiguration()
      verify(mockGetFundingSourceClientConfigurationUseCase.execute()).once()
    })

    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.getFundingSourceClientConfiguration(),
      ).resolves.toEqual([
        {
          type: 'stripe',
          version: 1,
          apiKey: 'dummyApiKey',
        },
      ])
    })
  })
  describe('setupFundingSource', () => {
    beforeEach(() => {
      when(mockSetupFundingSourceUseCase.execute(anything())).thenResolve(
        EntityDataFactory.provisionalFundingSource,
      )
    })
    it('generates use case', async () => {
      await instanceUnderTest.setupFundingSource({
        currency: 'dummyCurrency',
        type: FundingSourceType.CreditCard,
        applicationName: 'system-test-app',
      })
      expect(JestMockSetupFundingSourceUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected', async () => {
      const currency = v4()
      await instanceUnderTest.setupFundingSource({
        currency,
        type: FundingSourceType.CreditCard,
        applicationName: 'system-test-app',
      })
      verify(mockSetupFundingSourceUseCase.execute(anything())).once()
      const [args] = capture(mockSetupFundingSourceUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        currency,
        type: FundingSourceType.CreditCard,
        applicationName: 'system-test-app',
      })
    })
    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.setupFundingSource({
          currency: 'dummyCurrency',
          type: FundingSourceType.CreditCard,
          applicationName: 'system-test-app',
        }),
      ).resolves.toEqual(ApiDataFactory.provisionalFundingSource)
    })
  })

  describe('completeFundingSource', () => {
    beforeEach(() => {
      when(mockCompleteFundingSourceUseCase.execute(anything())).thenResolve(
        EntityDataFactory.defaultFundingSource,
      )
    })
    it('generates use case', async () => {
      await instanceUnderTest.completeFundingSource({
        id: '',
        completionData: { provider: 'stripe', paymentMethod: '' },
      })
      expect(JestMockCompleteFundingSourceUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected for credit card', async () => {
      const id = v4()
      await instanceUnderTest.completeFundingSource({
        id,
        completionData: { provider: 'stripe', paymentMethod: '' },
      })
      verify(mockCompleteFundingSourceUseCase.execute(anything())).once()
      const [args] = capture(mockCompleteFundingSourceUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        id,
        completionData: { provider: 'stripe', paymentMethod: '' },
      })
    })
    it('calls use case as expected for bank account', async () => {
      const id = v4()
      await instanceUnderTest.completeFundingSource({
        id,
        completionData: {
          provider: 'checkout',
          type: FundingSourceType.BankAccount,
          publicToken: 'publicToken',
          accountId: 'accountId',
          institutionId: 'institutionId',
          authorizationText: {
            content: 'authorizationText',
            contentType: 'authorizationTextContentType',
            language: 'authorizationTextLanguage',
            hash: 'authorizationTextHash',
            hashAlgorithm: 'authorizationTextHashAlgorithm',
          },
        },
      })
      verify(mockCompleteFundingSourceUseCase.execute(anything())).once()
      const [args] = capture(mockCompleteFundingSourceUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        id,
        completionData: {
          provider: 'checkout',
          type: FundingSourceType.BankAccount,
          publicToken: 'publicToken',
          accountId: 'accountId',
          institutionId: 'institutionId',
          authorizationText: {
            content: 'authorizationText',
            contentType: 'authorizationTextContentType',
            language: 'authorizationTextLanguage',
            hash: 'authorizationTextHash',
            hashAlgorithm: 'authorizationTextHashAlgorithm',
          },
        },
      })
    })

    it('returns expected result for credit card', async () => {
      await expect(
        instanceUnderTest.completeFundingSource({
          id: '',
          completionData: { provider: 'stripe', paymentMethod: '' },
        }),
      ).resolves.toEqual(ApiDataFactory.defaultFundingSource)
    })

    it('returns expected result for bank account', async () => {
      when(mockCompleteFundingSourceUseCase.execute(anything())).thenResolve(
        EntityDataFactory.bankAccountFundingSource,
      )
      await expect(
        instanceUnderTest.completeFundingSource({
          id: '',
          completionData: {
            provider: 'checkout',
            type: FundingSourceType.BankAccount,
            publicToken: 'publicToken',
            accountId: 'accountId',
            institutionId: 'institutionId',
            authorizationText: {
              content: 'authorizationText',
              contentType: 'authorizationTextContentType',
              language: 'authorizationTextLanguage',
              hash: 'authorizationTextHash',
              hashAlgorithm: 'authorizationTextHashAlgorithm',
            },
          },
        }),
      ).resolves.toEqual(ApiDataFactory.bankAccountFundingSource)
    })
  })

  describe('refreshFundingSource', () => {
    beforeEach(() => {
      when(mockRefreshFundingSourceUseCase.execute(anything())).thenResolve(
        EntityDataFactory.defaultFundingSource,
      )
    })
    it('generates use case', async () => {
      await instanceUnderTest.refreshFundingSource({
        id: '',
        refreshData: {
          provider: 'checkout',
          type: FundingSourceType.BankAccount,
          accountId: 'accountId',
          applicationName: 'system-test-app',
        },
      })
      expect(JestMockRefreshFundingSourceUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected for bank account', async () => {
      const id = v4()
      await instanceUnderTest.refreshFundingSource({
        id,
        refreshData: {
          provider: 'checkout',
          type: FundingSourceType.BankAccount,
          accountId: 'accountId',
          applicationName: 'system-test-app',
          authorizationText: {
            content: 'authorizationText',
            contentType: 'authorizationTextContentType',
            language: 'authorizationTextLanguage',
            hash: 'authorizationTextHash',
            hashAlgorithm: 'authorizationTextHashAlgorithm',
          },
        },
      })
      verify(mockRefreshFundingSourceUseCase.execute(anything())).once()
      const [args] = capture(mockRefreshFundingSourceUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        id,
        refreshData: {
          provider: 'checkout',
          type: FundingSourceType.BankAccount,
          applicationName: 'system-test-app',
          accountId: 'accountId',
          authorizationText: {
            content: 'authorizationText',
            contentType: 'authorizationTextContentType',
            language: 'authorizationTextLanguage',
            hash: 'authorizationTextHash',
            hashAlgorithm: 'authorizationTextHashAlgorithm',
          },
        },
      })
    })

    it('returns expected result for bank account', async () => {
      when(mockRefreshFundingSourceUseCase.execute(anything())).thenResolve(
        EntityDataFactory.bankAccountFundingSource,
      )
      await expect(
        instanceUnderTest.refreshFundingSource({
          id: v4(),
          refreshData: {
            provider: 'checkout',
            type: FundingSourceType.BankAccount,
            applicationName: 'system-test-app',
            accountId: 'accountId',
            authorizationText: {
              content: 'authorizationText',
              contentType: 'authorizationTextContentType',
              language: 'authorizationTextLanguage',
              hash: 'authorizationTextHash',
              hashAlgorithm: 'authorizationTextHashAlgorithm',
            },
          },
        }),
      ).resolves.toEqual(ApiDataFactory.bankAccountFundingSource)
    })

    it('returns expected result for bank account on failure', async () => {
      const interactionData: CheckoutBankAccountRefreshFundingSourceInteractionData =
        {
          authorizationText: [
            {
              content: 'authorizationText',
              contentType: 'authorizationTextContentType',
              language: 'authorizationTextLanguage',
              hash: 'authorizationTextHash',
              hashAlgorithm: 'authorizationTextHashAlgorithm',
            },
          ],
          linkToken: 'link-token',
          provider: 'checkout',
          type: FundingSourceType.BankAccount,
          version: 1,
        }
      when(mockRefreshFundingSourceUseCase.execute(anything())).thenReject(
        new FundingSourceRequiresUserInteractionError(interactionData),
      )
      await expect(
        instanceUnderTest.refreshFundingSource({
          id: v4(),
          refreshData: {
            provider: 'checkout',
            type: FundingSourceType.BankAccount,
            accountId: 'accountId',
            applicationName: 'system-test-app',
          },
        }),
      ).rejects.toEqual(
        new FundingSourceRequiresUserInteractionError(interactionData),
      )
    })
  })

  describe('subscribeToFundingSourceChanges', () => {
    it('generates use case', async () => {
      await instanceUnderTest.subscribeToFundingSourceChanges('id', {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fundingSourceChanged(_fundingSource: FundingSource): Promise<void> {
          return Promise.resolve()
        },
      })
      expect(
        JestMockSubscribeToFundingSourceChangesUseCase,
      ).toHaveBeenCalledTimes(1)
    })
  })

  describe('unsubscribeFromFundingSourceChanges', () => {
    it('generates use case', () => {
      instanceUnderTest.unsubscribeFromFundingSourceChanges('id')
      expect(
        JestMockUnsubscribeFromFundingSourceChangesUseCase,
      ).toHaveBeenCalledTimes(1)
    })
  })

  describe('getFundingSource', () => {
    beforeEach(() => {
      when(mockGetFundingSourceUseCase.execute(anything())).thenResolve(
        EntityDataFactory.defaultFundingSource,
      )
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })
    it('generates use case', async () => {
      await instanceUnderTest.getFundingSource({
        id: '',
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(JestMockGetFundingSourceUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected', async () => {
      const id = v4()
      const cachePolicy = CachePolicy.CacheOnly
      await instanceUnderTest.getFundingSource({ id, cachePolicy })
      verify(mockGetFundingSourceUseCase.execute(anything())).once()
      const [actualArgs] = capture(mockGetFundingSourceUseCase.execute).first()
      expect(actualArgs).toEqual<typeof actualArgs>({ id, cachePolicy })
    })
    it('returns undefined if use case result is undefined', async () => {
      when(mockGetFundingSourceUseCase.execute(anything())).thenResolve(
        undefined,
      )
      await expect(
        instanceUnderTest.getFundingSource({
          id: '',
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).resolves.toBeUndefined()
    })
    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.getFundingSource({
          id: '',
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).resolves.toEqual(ApiDataFactory.defaultFundingSource)
    })
  })

  describe('listFundingSources', () => {
    beforeEach(() => {
      when(mockListFundingSourcesUseCase.execute(anything())).thenResolve({
        fundingSources: [EntityDataFactory.defaultFundingSource],
        nextToken: 'nextToken',
      })
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })
    it('generates use case', async () => {
      await instanceUnderTest.listFundingSources({
        cachePolicy: CachePolicy.CacheOnly,
        limit: 0,
        nextToken: '',
      })
      expect(JestMockListFundingSourcesUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected', async () => {
      const cachePolicy = CachePolicy.CacheOnly
      const limit = 100
      const nextToken = v4()
      await instanceUnderTest.listFundingSources({
        cachePolicy,
        limit,
        nextToken,
      })
      verify(mockListFundingSourcesUseCase.execute(anything())).once()
      const [actualArgs] = capture(
        mockListFundingSourcesUseCase.execute,
      ).first()
      expect(actualArgs).toEqual<typeof actualArgs>({
        cachePolicy,
        limit,
        nextToken,
      })
    })
    it('returns empty list if use case result is empty list', async () => {
      when(mockListFundingSourcesUseCase.execute(anything())).thenResolve({
        fundingSources: [],
        nextToken: undefined,
      })
      await expect(
        instanceUnderTest.listFundingSources({
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).resolves.toEqual({ items: [], nextToken: undefined })
    })
    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.listFundingSources({
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).resolves.toEqual({
        items: [ApiDataFactory.defaultFundingSource],
        nextToken: 'nextToken',
      })
    })
  })

  describe('cancelFundingSource', () => {
    beforeEach(() => {
      when(mockCancelFundingSourceUseCase.execute(anything())).thenResolve(
        EntityDataFactory.defaultFundingSource,
      )
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })
    it('generates use case', async () => {
      await instanceUnderTest.cancelFundingSource('')
      expect(JestMockCancelFundingSourceUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected', async () => {
      const id = v4()
      await instanceUnderTest.cancelFundingSource(id)
      verify(mockCancelFundingSourceUseCase.execute(anything())).once()
      const [actualId] = capture(mockCancelFundingSourceUseCase.execute).first()
      expect(actualId).toEqual(id)
    })
    it('returns expected result', async () => {
      await expect(instanceUnderTest.cancelFundingSource('')).resolves.toEqual(
        ApiDataFactory.defaultFundingSource,
      )
    })
  })

  describe('provisionVirtualCard', () => {
    beforeEach(() => {
      when(mockProvisionVirtualCardUseCase.execute(anything())).thenResolve(
        EntityDataFactory.provisionalVirtualCard,
      )
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })
    it('generates use case', async () => {
      await instanceUnderTest.provisionVirtualCard({
        ownershipProofs: [],
        fundingSourceId: '',
        cardHolder: '',
        alias: '',
        currency: '',
      })
      expect(JestMockProvisionVirtualCardUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected', async () => {
      const clientRefId = v4()
      const ownershipProofs = [v4()]
      const fundingSourceId = v4()
      const cardHolder = v4()
      const alias = v4()
      const currency = v4()
      await instanceUnderTest.provisionVirtualCard({
        clientRefId,
        ownershipProofs,
        fundingSourceId,
        cardHolder,
        alias,
        currency,
      })
      verify(mockProvisionVirtualCardUseCase.execute(anything())).once()
      const [args] = capture(mockProvisionVirtualCardUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        clientRefId,
        ownershipProofs,
        fundingSourceId,
        cardHolder,
        alias,
        currency,
      })
    })
    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.provisionVirtualCard({
          ownershipProofs: [],
          fundingSourceId: '',
          cardHolder: '',
          alias: '',
          currency: '',
        }),
      ).resolves.toEqual(ApiDataFactory.provisionalVirtualCard)
    })
  })
  describe('updateVirtualCard', () => {
    beforeEach(() => {
      when(mockUpdateVirtualCardUseCase.execute(anything())).thenResolve({
        status: APIResultStatus.Success,
        result: EntityDataFactory.virtualCard,
      })
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })
    it('generates use case', async () => {
      await instanceUnderTest.updateVirtualCard({
        id: '',
        cardHolder: '',
        alias: '',
        billingAddress: undefined,
      })
      expect(JestMockUpdateVirtualCardUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected', async () => {
      const id = v4()
      const expectedCardVersion = 10
      const cardHolder = v4()
      const alias = v4()
      const billingAddress = EntityDataFactory.virtualCard
        .billingAddress as VirtualCardBillingAddressEntity
      await instanceUnderTest.updateVirtualCard({
        id,
        expectedCardVersion,
        cardHolder,
        alias,
        billingAddress,
      })
      verify(mockUpdateVirtualCardUseCase.execute(anything())).once()
      const [args] = capture(mockUpdateVirtualCardUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        id,
        expectedCardVersion,
        cardHolder,
        alias,
        billingAddress,
      })
    })
    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.updateVirtualCard({
          id: '',
          cardHolder: '',
          alias: '',
          billingAddress: undefined,
        }),
      ).resolves.toEqual({
        status: APIResultStatus.Success,
        result: ApiDataFactory.virtualCard,
      })
    })
  })

  describe('cancelVirtualCard', () => {
    beforeEach(() => {
      when(mockCancelVirtualCardUseCase.execute(anything())).thenResolve({
        status: APIResultStatus.Success,
        result: EntityDataFactory.virtualCard,
      })
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })
    it('generates use case', async () => {
      await instanceUnderTest.cancelVirtualCard({
        id: '',
      })
      expect(JestMockCancelVirtualCardUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected', async () => {
      const id = v4()
      await instanceUnderTest.cancelVirtualCard({
        id,
      })
      verify(mockCancelVirtualCardUseCase.execute(anything())).once()
      const [args] = capture(mockCancelVirtualCardUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        id,
      })
    })
    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.cancelVirtualCard({
          id: '',
        }),
      ).resolves.toEqual({
        status: APIResultStatus.Success,
        result: ApiDataFactory.virtualCard,
      })
    })
  })
  describe('getProvisionalCard', () => {
    beforeEach(() => {
      when(mockGetProvisionalCardUseCase.execute(anything())).thenResolve(
        EntityDataFactory.provisionalVirtualCard,
      )
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })
    it('generates use case', async () => {
      await instanceUnderTest.getProvisionalCard({
        id: '',
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(JestMockGetProvisionalCardUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected', async () => {
      const id = v4()
      await instanceUnderTest.getProvisionalCard({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockGetProvisionalCardUseCase.execute(anything())).once()
      const [args] = capture(mockGetProvisionalCardUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
    })
    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.getProvisionalCard({
          id: '',
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).resolves.toEqual(ApiDataFactory.provisionalVirtualCard)
    })
  })
  describe('listProvisionalCards', () => {
    beforeEach(() => {
      when(mockListProvisionalCardsUseCase.execute(anything())).thenResolve({
        status: ListOperationResultStatus.Success,
        items: [EntityDataFactory.provisionalVirtualCard],
      })
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })
    it('generates use case', async () => {
      await instanceUnderTest.listProvisionalCards()
      expect(JestMockListProvisionalCardsUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected', async () => {
      const limit = 23
      const nextToken = v4()
      await instanceUnderTest.listProvisionalCards({
        cachePolicy: CachePolicy.CacheOnly,
        limit,
        nextToken,
      })
      verify(mockListProvisionalCardsUseCase.execute(anything())).once()
      const [args] = capture(mockListProvisionalCardsUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        cachePolicy: CachePolicy.CacheOnly,
        limit,
        nextToken,
      })
    })
    it('returns expected result', async () => {
      await expect(instanceUnderTest.listProvisionalCards()).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        items: [ApiDataFactory.provisionalVirtualCard],
      })
    })
  })
  describe('getVirtualCard', () => {
    beforeEach(() => {
      when(mockGetVirtualCardUseCase.execute(anything())).thenResolve(
        EntityDataFactory.virtualCard,
      )
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })
    it('generates use case', async () => {
      await instanceUnderTest.getVirtualCard({
        id: '',
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(JestMockGetVirtualCardUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected', async () => {
      const id = v4()
      await instanceUnderTest.getVirtualCard({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockGetVirtualCardUseCase.execute(anything())).once()
      const [args] = capture(mockGetVirtualCardUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
    })
    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.getVirtualCard({
          id: '',
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).resolves.toEqual(ApiDataFactory.virtualCard)
    })
  })
  describe('listVirtualCards', () => {
    beforeEach(() => {
      when(mockListVirtualCardsUseCase.execute(anything())).thenResolve({
        status: ListOperationResultStatus.Success,
        items: [EntityDataFactory.virtualCard],
      })
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })
    it('generates use case', async () => {
      await instanceUnderTest.listVirtualCards()
      expect(JestMockListVirtualCardsUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected', async () => {
      const limit = 23
      const nextToken = v4()
      await instanceUnderTest.listVirtualCards({
        cachePolicy: CachePolicy.CacheOnly,
        limit,
        nextToken,
      })
      verify(mockListVirtualCardsUseCase.execute(anything())).once()
      const [args] = capture(mockListVirtualCardsUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        cachePolicy: CachePolicy.CacheOnly,
        limit,
        nextToken,
      })
    })
    it('returns expected result', async () => {
      await expect(instanceUnderTest.listVirtualCards()).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        items: [ApiDataFactory.virtualCard],
      })
    })
  })
  describe('getTransaction', () => {
    beforeEach(() => {
      when(mockGetTransactionUseCase.execute(anything())).thenResolve(
        EntityDataFactory.transaction,
      )
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })
    it('generates use case', async () => {
      await instanceUnderTest.getTransaction({
        id: '',
        cachePolicy: CachePolicy.CacheOnly,
      })
      expect(JestMockGetTransactionUseCase).toHaveBeenCalledTimes(1)
    })
    it('calls use case as expected', async () => {
      const id = v4()
      await instanceUnderTest.getTransaction({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockGetTransactionUseCase.execute(anything())).once()
      const [args] = capture(mockGetTransactionUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
    })
    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.getTransaction({
          id: '',
          cachePolicy: CachePolicy.CacheOnly,
        }),
      ).resolves.toEqual(ApiDataFactory.transaction)
    })
  })

  describe('listTransactions', () => {
    beforeEach(() => {
      when(mockListTransactionsUseCase.execute(anything())).thenResolve({
        status: ListOperationResultStatus.Success,
        items: [EntityDataFactory.transaction],
      })
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })

    it('generates use case', async () => {
      await instanceUnderTest.listTransactions({})
      expect(JestMockListTransactionsUseCase).toHaveBeenCalledTimes(1)
    })

    it('calls use case as expected', async () => {
      const cachePolicy = CachePolicy.CacheOnly
      const limit = 100
      const nextToken = v4()
      const dateRange = { startDate: new Date(), endDate: new Date() }
      const sortOrder = SortOrder.Asc
      await instanceUnderTest.listTransactions({
        cachePolicy,
        limit,
        nextToken,
        dateRange,
        sortOrder,
      })
      verify(mockListTransactionsUseCase.execute(anything())).once()
      const [args] = capture(mockListTransactionsUseCase.execute).first()
      expect(args).toEqual<typeof args>({
        cachePolicy,
        limit,
        nextToken,
        dateRange,
        sortOrder,
      })
    })

    it('returns expected result', async () => {
      await expect(instanceUnderTest.listTransactions({})).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        items: [ApiDataFactory.transaction],
      })
    })
  })

  describe('listTransactionsByCardId', () => {
    beforeEach(() => {
      when(mockListTransactionsByCardIdUseCase.execute(anything())).thenResolve(
        {
          status: ListOperationResultStatus.Success,
          items: [EntityDataFactory.transaction],
        },
      )
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })

    it('generates use case', async () => {
      await instanceUnderTest.listTransactionsByCardId({ cardId: '' })
      expect(JestMockListTransactionsByCardIdUseCase).toHaveBeenCalledTimes(1)
    })

    it('calls use case as expected', async () => {
      const cardId = v4()
      const cachePolicy = CachePolicy.CacheOnly
      const limit = 100
      const nextToken = v4()
      const dateRange = { startDate: new Date(), endDate: new Date() }
      const sortOrder = SortOrder.Asc
      await instanceUnderTest.listTransactionsByCardId({
        cardId,
        cachePolicy,
        limit,
        nextToken,
        dateRange,
        sortOrder,
      })
      verify(mockListTransactionsByCardIdUseCase.execute(anything())).once()
      const [args] = capture(
        mockListTransactionsByCardIdUseCase.execute,
      ).first()
      expect(args).toEqual<typeof args>({
        cardId,
        cachePolicy,
        limit,
        nextToken,
        dateRange,
        sortOrder,
      })
    })

    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.listTransactionsByCardId({ cardId: '' }),
      ).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        items: [ApiDataFactory.transaction],
      })
    })
  })

  describe('listTransactionsByCardIdAndType', () => {
    beforeEach(() => {
      when(
        mockListTransactionsByCardIdAndTypeUseCase.execute(anything()),
      ).thenResolve({
        status: ListOperationResultStatus.Success,
        items: [EntityDataFactory.transaction],
      })
      when(mockSudoUserClient.isSignedIn()).thenResolve(true)
    })

    it('generates use case', async () => {
      await instanceUnderTest.listTransactionsByCardIdAndType({
        cardId: '',
        transactionType: TransactionType.Pending,
      })
      expect(
        JestMockListTransactionsByCardIdAndTypeUseCase,
      ).toHaveBeenCalledTimes(1)
    })

    it('calls use case as expected', async () => {
      const cardId = v4()
      const transactionType = TransactionType.Pending
      const cachePolicy = CachePolicy.CacheOnly
      const limit = 100
      const nextToken = v4()
      await instanceUnderTest.listTransactionsByCardIdAndType({
        cardId,
        transactionType,
        cachePolicy,
        limit,
        nextToken,
      })
      verify(
        mockListTransactionsByCardIdAndTypeUseCase.execute(anything()),
      ).once()
      const [args] = capture(
        mockListTransactionsByCardIdAndTypeUseCase.execute,
      ).first()
      expect(args).toEqual<typeof args>({
        cardId,
        transactionType,
        cachePolicy,
        limit,
        nextToken,
      })
    })

    it('returns expected result', async () => {
      await expect(
        instanceUnderTest.listTransactionsByCardIdAndType({
          cardId: '',
          transactionType: TransactionType.Pending,
        }),
      ).resolves.toEqual({
        status: ListOperationResultStatus.Success,
        items: [ApiDataFactory.transaction],
      })
    })
  })

  describe('sandboxGetPlaidData', () => {
    const result: SandboxPlaidData = {
      accountMetadata: [
        { accountId: 'account-id', subtype: BankAccountType.Checking },
      ],
      publicToken: 'public-token',
    }

    beforeEach(() => {
      when(mockSandboxGetPlaidDataUseCase.execute(anything())).thenResolve(
        result,
      )
    })

    it('returns expected result', async () => {
      const input: SandboxGetPlaidDataInput = {
        institutionId: 'institution-id',
        plaidUsername: 'plaid-username',
      }

      await expect(
        instanceUnderTest.sandboxGetPlaidData(input),
      ).resolves.toEqual(result)

      expect(JestMockSandboxGetPlaidDataUseCase).toHaveBeenCalledTimes(1)

      verify(mockSandboxGetPlaidDataUseCase.execute(anything())).once()
      const [actualInput] = capture(
        mockSandboxGetPlaidDataUseCase.execute,
      ).first()
      expect(actualInput).toEqual(input)
    })
  })

  describe('sandboxSetFundingSourceToRequireRefresh', () => {
    beforeEach(() => {
      when(
        mockSandboxSetFundingSourceToRequireRefreshUseCase.execute(anything()),
      ).thenResolve(EntityDataFactory.bankAccountFundingSource)
    })

    it('returns expected result', async () => {
      const input: SandboxSetFundingSourceToRequireRefreshInput = {
        fundingSourceId: EntityDataFactory.bankAccountFundingSource.id,
      }

      await expect(
        instanceUnderTest.sandboxSetFundingSourceToRequireRefresh(input),
      ).resolves.toEqual(EntityDataFactory.bankAccountFundingSource)

      expect(
        JestMockSandboxSetFundingSourceToRequireRefreshUseCase,
      ).toHaveBeenCalledTimes(1)

      verify(
        mockSandboxSetFundingSourceToRequireRefreshUseCase.execute(anything()),
      ).once()
      const [actualInput] = capture(
        mockSandboxSetFundingSourceToRequireRefreshUseCase.execute,
      ).first()
      expect(actualInput).toEqual(input)
    })
  })

  describe('reset', () => {
    it('deletes all keys from keyManager', async () => {
      await instanceUnderTest.reset()
      verify(mockSudoKeyManager.removeAllKeys()).once()
    })
  })
})
