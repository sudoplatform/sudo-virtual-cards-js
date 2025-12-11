/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiClientManager } from '@sudoplatform/sudo-api-client'
import { Base64, UnknownGraphQLError } from '@sudoplatform/sudo-common'

import { GraphQLError } from 'graphql'
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
  CancelFundingSourceDocument,
  CancelProvisionalFundingSourceDocument,
  CancelVirtualCardDocument,
  CompleteFundingSourceDocument,
  CreatePublicKeyDocument,
  FundingSourceType,
  GetCardDocument,
  GetFundingSourceClientConfigurationDocument,
  GetFundingSourceDocument,
  GetKeyRingDocument,
  GetProvisionalCardDocument,
  GetPublicKeyDocument,
  GetPublicKeysDocument,
  GetTransactionDocument,
  KeyFormat,
  ListCardsDocument,
  ListFundingSourcesDocument,
  ListProvisionalCardsDocument,
  ListProvisionalFundingSourcesDocument,
  ListTransactionsByCardIdAndTypeDocument,
  ListTransactionsByCardIdDocument,
  ListTransactionsDocument,
  ProvisionVirtualCardDocument,
  SetupFundingSourceDocument,
  SortOrder,
  TransactionType,
  UpdateVirtualCardDocument,
} from '../../../../../src/gen/graphqlTypes'
import { ApiClient } from '../../../../../src/private/data/common/apiClient'
import { GraphQLDataFactory } from '../../../data-factory/graphQl'
import { GraphQLClient } from '@sudoplatform/sudo-user'

describe('ApiClient Test Suite', () => {
  let instanceUnderTest: ApiClient
  const mockApiClientManager = mock<ApiClientManager>()
  const mockClient = mock<GraphQLClient>()

  beforeEach(() => {
    reset(mockApiClientManager)
    reset(mockClient)
    when(mockApiClientManager.getClient(anything())).thenReturn(
      instance(mockClient),
    )
    instanceUnderTest = new ApiClient(instance(mockApiClientManager))
  })

  describe('createPublicKey', () => {
    it('performs successfully', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        data: {
          createPublicKeyForVirtualCards: GraphQLDataFactory.publicKey,
        },
      } as any)
      const algorithm = v4()
      const keyId = v4()
      const keyRingId = v4()
      const publicKey = v4()
      await expect(
        instanceUnderTest.createPublicKey({
          algorithm,
          keyId,
          keyRingId,
          publicKey,
        }),
      ).resolves.toStrictEqual(GraphQLDataFactory.publicKey)
      verify(mockClient.mutate(anything())).once()
      const [args] = capture(mockClient.mutate as any).first()
      expect(args).toStrictEqual({
        mutation: CreatePublicKeyDocument,
        variables: {
          input: {
            algorithm,
            keyId,
            keyRingId,
            publicKey,
          },
        },
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.mutate(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.createPublicKey({
          algorithm: '',
          keyId: '',
          keyRingId: '',
          publicKey: '',
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        errors: [new GraphQLError('failed')],
      } as any)
      await expect(
        instanceUnderTest.createPublicKey({
          algorithm: '',
          keyId: '',
          keyRingId: '',
          publicKey: '',
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })
  describe('getPublicKey', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          getPublicKeyForVirtualCards: GraphQLDataFactory.publicKey,
        },
      } as any)
      const keyId = v4()
      await expect(
        instanceUnderTest.getPublicKey(keyId),
      ).resolves.toStrictEqual(GraphQLDataFactory.publicKey)
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        query: GetPublicKeyDocument,
        variables: {
          keyId,
          keyFormats: undefined,
        },
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(instanceUnderTest.getPublicKey('')).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(instanceUnderTest.getPublicKey('')).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
  })
  describe('getPublicKeys', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          getPublicKeysForVirtualCards: {
            items: [GraphQLDataFactory.publicKey],
          },
        },
      } as any)
      const limit = 100
      const nextToken = v4()
      await expect(
        instanceUnderTest.getPublicKeys(limit, nextToken),
      ).resolves.toStrictEqual({ items: [GraphQLDataFactory.publicKey] })
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        query: GetPublicKeysDocument,
        variables: {
          limit,
          nextToken,
        },
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(instanceUnderTest.getPublicKeys()).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(instanceUnderTest.getPublicKeys()).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
  })
  describe('getKeyRing', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          getKeyRingForVirtualCards: {
            items: [GraphQLDataFactory.publicKey],
          },
        },
      } as any)
      const keyRingId = v4()
      const limit = 100
      const nextToken = v4()
      const keyFormats = [KeyFormat.RsaPublicKey, KeyFormat.Spki]
      await expect(
        instanceUnderTest.getKeyRing({
          keyRingId,
          limit,
          nextToken,
          keyFormats,
        }),
      ).resolves.toStrictEqual({
        items: [GraphQLDataFactory.publicKey],
      })
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        query: GetKeyRingDocument,
        variables: {
          keyRingId,
          limit,
          nextToken,
          keyFormats,
        },
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.getKeyRing({ keyRingId: '' }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(
        instanceUnderTest.getKeyRing({ keyRingId: '' }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })
  describe('getFundingSourceClientConfiguration', () => {
    it('performs successfully', async () => {
      const data = v4()
      when(mockClient.query(anything())).thenResolve({
        data: {
          getFundingSourceClientConfiguration: {
            data,
          },
        },
      } as any)
      await expect(
        instanceUnderTest.getFundingSourceClientConfiguration(),
      ).resolves.toStrictEqual({ data })
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        variables: undefined,
        query: GetFundingSourceClientConfigurationDocument,
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.getFundingSourceClientConfiguration(),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(
        instanceUnderTest.getFundingSourceClientConfiguration(),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })
  describe('getFundingSource', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          getFundingSource: GraphQLDataFactory.defaultFundingSource,
        },
      } as any)
      const id = v4()
      await expect(
        instanceUnderTest.getFundingSource(id),
      ).resolves.toStrictEqual(GraphQLDataFactory.defaultFundingSource)
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        variables: { id },
        query: GetFundingSourceDocument,
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(instanceUnderTest.getFundingSource('')).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(instanceUnderTest.getFundingSource('')).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
  })
  describe('listFundingSources', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          listFundingSources: {
            items: [GraphQLDataFactory.defaultFundingSource],
            nextToken: undefined,
          },
        },
      } as any)
      const limit = 100
      const nextToken = v4()
      const filter = undefined
      const sortOrder = undefined
      await expect(
        instanceUnderTest.listFundingSources(
          filter,
          sortOrder,
          limit,
          nextToken,
        ),
      ).resolves.toStrictEqual({
        items: [GraphQLDataFactory.defaultFundingSource],
        nextToken: undefined,
      })
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        variables: { filter, sortOrder, limit, nextToken },
        query: ListFundingSourcesDocument,
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(instanceUnderTest.listFundingSources()).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(instanceUnderTest.listFundingSources()).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
  })
  describe('listProvisionalFundingSources', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          listProvisionalFundingSources: {
            items: [GraphQLDataFactory.provisionalFundingSource],
            nextToken: undefined,
          },
        },
      } as any)
      const filter = undefined
      const sortOrder = undefined
      const limit = 100
      const nextToken = v4()
      await expect(
        instanceUnderTest.listProvisionalFundingSources(
          filter,
          sortOrder,
          limit,
          nextToken,
        ),
      ).resolves.toStrictEqual({
        items: [GraphQLDataFactory.provisionalFundingSource],
        nextToken: undefined,
      })
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        variables: { filter, sortOrder, limit, nextToken },
        query: ListProvisionalFundingSourcesDocument,
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.listProvisionalFundingSources(),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(
        instanceUnderTest.listProvisionalFundingSources(),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })
  describe('setupFundingSource', () => {
    it('performs successfully', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        data: {
          setupFundingSource: GraphQLDataFactory.provisionalFundingSource,
        },
      } as any)
      const currency = v4()
      const type = FundingSourceType.CreditCard
      const setupData = Base64.encodeString(
        JSON.stringify({ applicationName: 'system-test-app' }),
      )
      await expect(
        instanceUnderTest.setupFundingSource({
          currency,
          type,
          setupData,
        }),
      ).resolves.toStrictEqual(GraphQLDataFactory.provisionalFundingSource)
      verify(mockClient.mutate(anything())).once()
      const [args] = capture(mockClient.mutate as any).first()
      expect(args).toStrictEqual({
        mutation: SetupFundingSourceDocument,
        variables: {
          input: {
            currency,
            type,
            setupData,
          },
        },
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.mutate(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.setupFundingSource({
          currency: '',
          type: FundingSourceType.CreditCard,
          setupData: Base64.encodeString(
            JSON.stringify({ applicationName: 'system-test-app' }),
          ),
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        errors: [new GraphQLError('failed')],
      } as any)
      await expect(
        instanceUnderTest.setupFundingSource({
          currency: '',
          type: FundingSourceType.CreditCard,
          setupData: Base64.encodeString(
            JSON.stringify({ applicationName: 'system-test-app' }),
          ),
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })
  describe('completeFundingSource', () => {
    it('performs successfully', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        data: {
          completeFundingSource: GraphQLDataFactory.defaultFundingSource,
        },
      } as any)
      const completionData = v4()
      const id = v4()
      await expect(
        instanceUnderTest.completeFundingSource({
          completionData,
          id,
        }),
      ).resolves.toStrictEqual(GraphQLDataFactory.defaultFundingSource)
      verify(mockClient.mutate(anything())).once()
      const [args] = capture(mockClient.mutate as any).first()
      expect(args).toStrictEqual({
        mutation: CompleteFundingSourceDocument,
        variables: {
          input: {
            completionData,
            id,
          },
        },
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.mutate(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.completeFundingSource({
          completionData: '',
          id: '',
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        errors: [new GraphQLError('failed')],
      } as any)
      await expect(
        instanceUnderTest.completeFundingSource({
          completionData: '',
          id: '',
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })
  describe('cancelFundingSource', () => {
    it('performs successfully', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        data: {
          cancelFundingSource: GraphQLDataFactory.defaultFundingSource,
        },
      } as any)
      const id = v4()
      await expect(
        instanceUnderTest.cancelFundingSource({
          id,
        }),
      ).resolves.toStrictEqual(GraphQLDataFactory.defaultFundingSource)
      verify(mockClient.mutate(anything())).once()
      const [args] = capture(mockClient.mutate as any).first()
      expect(args).toStrictEqual({
        mutation: CancelFundingSourceDocument,
        variables: {
          input: {
            id,
          },
        },
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.mutate(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.cancelFundingSource({
          id: '',
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        errors: [new GraphQLError('failed')],
      } as any)
      await expect(
        instanceUnderTest.cancelFundingSource({
          id: '',
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })
  describe('cancelProvisiionalFundingSource', () => {
    it('performs successfully', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        data: {
          cancelProvisionalFundingSource:
            GraphQLDataFactory.provisionalFundingSource,
        },
      } as any)
      const id = v4()
      await expect(
        instanceUnderTest.cancelProvisionalFundingSource({
          id,
        }),
      ).resolves.toStrictEqual(GraphQLDataFactory.provisionalFundingSource)
      verify(mockClient.mutate(anything())).once()
      const [args] = capture(mockClient.mutate as any).first()
      expect(args).toStrictEqual({
        mutation: CancelProvisionalFundingSourceDocument,
        variables: {
          input: {
            id,
          },
        },
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.mutate(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.cancelProvisionalFundingSource({
          id: '',
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        errors: [new GraphQLError('failed')],
      } as any)
      await expect(
        instanceUnderTest.cancelProvisionalFundingSource({
          id: '',
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })
  describe('provisionVirtualCard', () => {
    it('performs successfully', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        data: {
          cardProvision: GraphQLDataFactory.provisionalCard,
        },
      } as any)
      const alias = v4()
      const billingAddress = {
        addressLine1: v4(),
        addressLine2: v4(),
        city: v4(),
        state: v4(),
        country: v4(),
        postalCode: v4(),
      }
      const cardHolder = v4()
      const clientRefId = v4()
      const currency = v4()
      const fundingSourceId = v4()
      const keyRingId = v4()
      const ownerProofs = [v4()]
      await expect(
        instanceUnderTest.provisionVirtualCard({
          alias,
          billingAddress,
          cardHolder,
          clientRefId,
          currency,
          fundingSourceId,
          keyRingId,
          ownerProofs,
        }),
      ).resolves.toStrictEqual(GraphQLDataFactory.provisionalCard)
      verify(mockClient.mutate(anything())).once()
      const [args] = capture(mockClient.mutate as any).first()
      expect(args).toStrictEqual({
        mutation: ProvisionVirtualCardDocument,
        variables: {
          input: {
            alias,
            billingAddress,
            cardHolder,
            clientRefId,
            currency,
            fundingSourceId,
            keyRingId,
            ownerProofs,
          },
        },
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.mutate(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.provisionVirtualCard({
          alias: '',
          cardHolder: '',
          clientRefId: '',
          currency: '',
          fundingSourceId: '',
          keyRingId: '',
          ownerProofs: [],
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        errors: [new GraphQLError('failed')],
      } as any)
      await expect(
        instanceUnderTest.provisionVirtualCard({
          alias: '',
          cardHolder: '',
          clientRefId: '',
          currency: '',
          fundingSourceId: '',
          keyRingId: '',
          ownerProofs: [],
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })
  describe('getProvisionalCard', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          getProvisionalCard: GraphQLDataFactory.provisionalCard,
        },
      } as any)
      const id = v4()
      await expect(
        instanceUnderTest.getProvisionalCard(id),
      ).resolves.toStrictEqual(GraphQLDataFactory.provisionalCard)
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        variables: { id },
        query: GetProvisionalCardDocument,
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(instanceUnderTest.getProvisionalCard('')).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(instanceUnderTest.getProvisionalCard('')).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
  })
  describe('listProvisionalCards', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          listProvisionalCards: {
            items: [GraphQLDataFactory.provisionalCard],
            nextToken: undefined,
          },
        },
      } as any)
      const limit = 100
      const nextToken = v4()
      await expect(
        instanceUnderTest.listProvisionalCards(limit, nextToken),
      ).resolves.toStrictEqual({
        items: [GraphQLDataFactory.provisionalCard],
        nextToken: undefined,
      })
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        variables: { limit, nextToken },
        query: ListProvisionalCardsDocument,
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(instanceUnderTest.listProvisionalCards()).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(instanceUnderTest.listProvisionalCards()).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
  })
  describe('getVirtualCard', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          getCard: GraphQLDataFactory.sealedCard,
        },
      } as any)
      const id = v4()
      const keyId = v4()
      await expect(
        instanceUnderTest.getCard({ id, keyId }),
      ).resolves.toStrictEqual(GraphQLDataFactory.sealedCard)
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        variables: { id, keyId },
        query: GetCardDocument,
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(instanceUnderTest.getCard({ id: '' })).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(instanceUnderTest.getCard({ id: '' })).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
  })
  describe('listVirtualCards', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          listCards: {
            items: [GraphQLDataFactory.sealedCard],
            nextToken: undefined,
          },
        },
      } as any)
      const filter = undefined
      const sortOrder = undefined
      const limit = 100
      const nextToken = v4()
      await expect(
        instanceUnderTest.listCards(filter, sortOrder, limit, nextToken),
      ).resolves.toStrictEqual({
        items: [GraphQLDataFactory.sealedCard],
        nextToken: undefined,
      })
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        variables: { filter, sortOrder, limit, nextToken },
        query: ListCardsDocument,
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(instanceUnderTest.listCards()).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(instanceUnderTest.listCards()).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
  })
  describe('updateVirtualCard', () => {
    it('performs successfully', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        data: {
          updateCard: GraphQLDataFactory.sealedCard,
        },
      } as any)
      const alias = v4()
      const billingAddress = {
        addressLine1: v4(),
        addressLine2: v4(),
        city: v4(),
        state: v4(),
        country: v4(),
        postalCode: v4(),
      }
      const cardHolder = v4()
      const expectedVersion = 100
      const id = v4()
      const keyId = v4()
      await expect(
        instanceUnderTest.updateVirtualCard({
          alias,
          billingAddress,
          cardHolder,
          expectedVersion,
          id,
          keyId,
        }),
      ).resolves.toStrictEqual(GraphQLDataFactory.sealedCard)
      verify(mockClient.mutate(anything())).once()
      const [args] = capture(mockClient.mutate as any).first()
      expect(args).toStrictEqual({
        mutation: UpdateVirtualCardDocument,
        variables: {
          input: {
            alias,
            billingAddress,
            cardHolder,
            expectedVersion,
            id,
            keyId,
          },
        },
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.mutate(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.updateVirtualCard({
          alias: '',
          cardHolder: '',
          id: '',
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        errors: [new GraphQLError('failed')],
      } as any)
      await expect(
        instanceUnderTest.updateVirtualCard({
          alias: '',
          cardHolder: '',
          id: '',
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })
  describe('cancelVirtualCard', () => {
    it('performs successfully', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        data: {
          cancelCard: GraphQLDataFactory.sealedCard,
        },
      } as any)
      const id = v4()
      const keyId = v4()
      await expect(
        instanceUnderTest.cancelVirtualCard({
          id,
          keyId,
        }),
      ).resolves.toStrictEqual(GraphQLDataFactory.sealedCard)
      verify(mockClient.mutate(anything())).once()
      const [args] = capture(mockClient.mutate as any).first()
      expect(args).toStrictEqual({
        mutation: CancelVirtualCardDocument,
        variables: {
          input: {
            id,
            keyId,
          },
        },
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.mutate(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.cancelVirtualCard({
          id: '',
          keyId: '',
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.mutate(anything())).thenResolve({
        errors: [new GraphQLError('failed')],
      } as any)
      await expect(
        instanceUnderTest.cancelVirtualCard({
          id: '',
          keyId: '',
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })
  describe('getTransaction', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          getTransaction: GraphQLDataFactory.sealedTransaction,
        },
      } as any)
      const id = v4()
      const keyId = v4()
      await expect(
        instanceUnderTest.getTransaction({
          id,
          keyId,
        }),
      ).resolves.toStrictEqual(GraphQLDataFactory.sealedTransaction)
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        variables: {
          id,
          keyId,
        },
        query: GetTransactionDocument,
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.getTransaction({ id: '' }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(
        instanceUnderTest.getTransaction({ id: '' }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })

  describe('listTransactions', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          listTransactions2: {
            items: [GraphQLDataFactory.sealedTransaction],
            nextToken: undefined,
          },
        },
      } as any)
      const limit = 100
      const nextToken = v4()
      const dateRange = { startDateEpochMs: 1.0, endDateEpochMs: 2.0 }
      const sortOrder = SortOrder.Asc
      await expect(
        instanceUnderTest.listTransactions({
          limit,
          nextToken,
          dateRange,
          sortOrder,
        }),
      ).resolves.toStrictEqual({
        items: [GraphQLDataFactory.sealedTransaction],
        nextToken: undefined,
      })
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        variables: {
          limit,
          nextToken,
          dateRange,
          sortOrder,
        },
        query: ListTransactionsDocument,
      })
    })

    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(instanceUnderTest.listTransactions({})).rejects.toThrow(
        UnknownGraphQLError,
      )
    })

    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(instanceUnderTest.listTransactions({})).rejects.toThrow(
        UnknownGraphQLError,
      )
    })
  })

  describe('listTransactionsByCardId', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          listTransactionsByCardId2: {
            items: [GraphQLDataFactory.sealedTransaction],
            nextToken: undefined,
          },
        },
      } as any)
      const cardId = v4()
      const limit = 100
      const nextToken = v4()
      const dateRange = { startDateEpochMs: 1.0, endDateEpochMs: 2.0 }
      const sortOrder = SortOrder.Asc
      await expect(
        instanceUnderTest.listTransactionsByCardId({
          cardId,
          limit,
          nextToken,
          dateRange,
          sortOrder,
        }),
      ).resolves.toStrictEqual({
        items: [GraphQLDataFactory.sealedTransaction],
        nextToken: undefined,
      })
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        variables: {
          cardId,
          limit,
          nextToken,
          dateRange,
          sortOrder,
        },
        query: ListTransactionsByCardIdDocument,
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.listTransactionsByCardId({ cardId: '' }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null,
        errors: [new GraphQLError('failed')],
      })
      await expect(
        instanceUnderTest.listTransactionsByCardId({ cardId: '' }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })

  describe('listTransactionsByCardIdAndType', () => {
    it('performs successfully', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: {
          listTransactionsByCardIdAndType: {
            items: [GraphQLDataFactory.sealedTransaction],
            nextToken: undefined,
          },
        },
      } as any)
      const cardId = v4()
      const transactionType = TransactionType.Pending
      const limit = 100
      const nextToken = v4()
      await expect(
        instanceUnderTest.listTransactionsByCardIdAndType({
          cardId,
          transactionType,
          limit,
          nextToken,
        }),
      ).resolves.toStrictEqual({
        items: [GraphQLDataFactory.sealedTransaction],
        nextToken: undefined,
      })
      verify(mockClient.query(anything())).once()
      const [args] = capture(mockClient.query as any).first()
      expect(args).toStrictEqual({
        variables: {
          cardId,
          transactionType,
          limit,
          nextToken,
        },
        query: ListTransactionsByCardIdAndTypeDocument,
      })
    })
    it('handles thrown error from app sync call', async () => {
      when(mockClient.query(anything())).thenReject(
        new Error({
          graphQLErrors: [new GraphQLError('appsync failure')],
        } as any),
      )
      await expect(
        instanceUnderTest.listTransactionsByCardIdAndType({
          cardId: '',
          transactionType: TransactionType.Pending,
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
    it('handles error from graphQl', async () => {
      when(mockClient.query(anything())).thenResolve({
        data: null as any,
        errors: [new GraphQLError('failed')],
      })
      await expect(
        instanceUnderTest.listTransactionsByCardIdAndType({
          cardId: '',
          transactionType: TransactionType.Pending,
        }),
      ).rejects.toThrow(UnknownGraphQLError)
    })
  })
})
