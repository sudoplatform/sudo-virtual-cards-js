import { Base64, CachePolicy } from '@sudoplatform/sudo-common'
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
import { FundingSourceType } from '../../../../../src'
import { ApiClient } from '../../../../../src/private/data/common/apiClient'
import { DefaultFundingSourceService } from '../../../../../src/private/data/fundingSource/defaultFundingSourceService'
import { EntityDataFactory } from '../../../data-factory/entity'
import { GraphQLDataFactory } from '../../../data-factory/graphQl'

describe('DefaultFundingSourceService Test Suite', () => {
  const mockAppSync = mock<ApiClient>()
  let instanceUnderTest: DefaultFundingSourceService

  beforeEach(() => {
    reset(mockAppSync)
    instanceUnderTest = new DefaultFundingSourceService(instance(mockAppSync))
  })

  describe('getFundingSourceClientConfiguration', () => {
    beforeEach(() => {
      when(mockAppSync.getFundingSourceClientConfiguration()).thenResolve({
        data: v4(),
      })
    })
    it('calls appSync', async () => {
      await instanceUnderTest.getFundingSourceClientConfiguration()
      verify(mockAppSync.getFundingSourceClientConfiguration()).once()
    })
    it('returns appsync data', async () => {
      const data = v4()
      when(mockAppSync.getFundingSourceClientConfiguration()).thenResolve({
        data,
      })
      await expect(
        instanceUnderTest.getFundingSourceClientConfiguration(),
      ).resolves.toStrictEqual(data)
    })
  })
  describe('setupFundingSource', () => {
    beforeEach(() => {
      when(mockAppSync.setupFundingSource(anything())).thenResolve(
        GraphQLDataFactory.provisionalFundingSource,
      )
    })

    it('calls appSync', async () => {
      await instanceUnderTest.setupFundingSource({
        currency: 'dummyCurrency',
        type: FundingSourceType.CreditCard,
      })
      verify(mockAppSync.setupFundingSource(anything())).once()
      const [args] = capture(mockAppSync.setupFundingSource).first()

      expect(args).toStrictEqual<typeof args>({
        currency: 'dummyCurrency',
        type: FundingSourceType.CreditCard,
      })
    })
    it('returns appsync data', async () => {
      when(mockAppSync.setupFundingSource(anything())).thenResolve(
        GraphQLDataFactory.provisionalFundingSource,
      )
      await expect(
        instanceUnderTest.setupFundingSource({
          currency: 'dummyCurrency',
          type: FundingSourceType.CreditCard,
        }),
      ).resolves.toStrictEqual(EntityDataFactory.provisionalFundingSource)
    })
  })

  describe('completeFundingSource', () => {
    beforeEach(() => {
      when(mockAppSync.completeFundingSource(anything())).thenResolve(
        GraphQLDataFactory.fundingSource,
      )
    })

    it('calls appSync', async () => {
      const completionData = { provider: v4(), version: 1, paymentMethod: v4() }
      await instanceUnderTest.completeFundingSource({
        id: 'dummyId',
        completionData: completionData,
      })
      verify(mockAppSync.completeFundingSource(anything())).once()
      const [args] = capture(mockAppSync.completeFundingSource).first()

      expect(args).toStrictEqual<typeof args>({
        id: 'dummyId',
        completionData: Base64.encodeString(
          JSON.stringify({
            provider: completionData.provider,
            version: completionData.version,
            payment_method: completionData.paymentMethod,
          }),
        ),
        updateCardFundingSource: undefined,
      })
    })
    it('returns appsync data', async () => {
      when(mockAppSync.completeFundingSource(anything())).thenResolve(
        GraphQLDataFactory.fundingSource,
      )
      await expect(
        instanceUnderTest.completeFundingSource({
          id: 'dummyId',
          completionData: { provider: '', version: 1, paymentMethod: '' },
        }),
      ).resolves.toStrictEqual(EntityDataFactory.fundingSource)
    })
  })
  describe('getFundingSource', () => {
    it('calls appsync correctly', async () => {
      when(mockAppSync.getFundingSource(anything(), anything())).thenResolve(
        GraphQLDataFactory.fundingSource,
      )
      const id = v4()
      const result = await instanceUnderTest.getFundingSource({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockAppSync.getFundingSource(anything(), anything())).once()
      const [idArg, policyArg] = capture(mockAppSync.getFundingSource).first()
      expect(idArg).toStrictEqual<typeof idArg>(id)
      expect(policyArg).toStrictEqual<typeof policyArg>('cache-only')
      expect(result).toEqual(EntityDataFactory.fundingSource)
    })

    it('calls appsync correctly with undefined result', async () => {
      when(mockAppSync.getFundingSource(anything(), anything())).thenResolve(
        undefined,
      )
      const id = v4()
      const result = await instanceUnderTest.getFundingSource({
        id,
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(mockAppSync.getFundingSource(anything(), anything())).once()
      const [idArg, policyArg] = capture(mockAppSync.getFundingSource).first()
      expect(idArg).toStrictEqual<typeof idArg>(id)
      expect(policyArg).toStrictEqual<typeof policyArg>('cache-only')
      expect(result).toEqual(undefined)
    })

    it.each`
      cachePolicy               | test
      ${CachePolicy.CacheOnly}  | ${'cache'}
      ${CachePolicy.RemoteOnly} | ${'remote'}
    `(
      'returns transformed result when calling $test',
      async ({ cachePolicy }) => {
        when(mockAppSync.getFundingSource(anything(), anything())).thenResolve(
          GraphQLDataFactory.fundingSource,
        )
        const id = v4()
        await expect(
          instanceUnderTest.getFundingSource({
            id,
            cachePolicy,
          }),
        ).resolves.toEqual(EntityDataFactory.fundingSource)
        verify(mockAppSync.getFundingSource(anything(), anything())).once()
      },
    )
  })

  describe('listFundingSources', () => {
    it('calls appsync correctly', async () => {
      when(
        mockAppSync.listFundingSources(anything(), anything(), anything()),
      ).thenResolve(GraphQLDataFactory.fundingSourceConnection)
      const result = await instanceUnderTest.listFundingSources({
        cachePolicy: CachePolicy.CacheOnly,
      })
      verify(
        mockAppSync.listFundingSources(anything(), anything(), anything()),
      ).once()
      const [policyArg] = capture(mockAppSync.listFundingSources).first()
      expect(policyArg).toStrictEqual<typeof policyArg>('cache-only')
      expect(result).toStrictEqual({
        fundingSources: [EntityDataFactory.fundingSource],
        nextToken: undefined,
      })
    })

    it.each`
      cachePolicy               | test
      ${CachePolicy.CacheOnly}  | ${'cache'}
      ${CachePolicy.RemoteOnly} | ${'remote'}
    `(
      'returns transformed result when calling $test',
      async ({ cachePolicy }) => {
        when(
          mockAppSync.listFundingSources(anything(), anything(), anything()),
        ).thenResolve(GraphQLDataFactory.fundingSourceConnection)
        await expect(
          instanceUnderTest.listFundingSources({
            cachePolicy,
          }),
        ).resolves.toStrictEqual({
          fundingSources: [EntityDataFactory.fundingSource],
          nextToken: undefined,
        })
        verify(
          mockAppSync.listFundingSources(anything(), anything(), anything()),
        ).once()
      },
    )
  })

  describe('cancelFundingSource', () => {
    it('calls appsync correctly', async () => {
      when(mockAppSync.cancelFundingSource(anything())).thenResolve(
        GraphQLDataFactory.fundingSource,
      )
      const result = await instanceUnderTest.cancelFundingSource({
        id: EntityDataFactory.fundingSource.id,
      })
      expect(result).toStrictEqual(EntityDataFactory.fundingSource)
      const [inputArgs] = capture(mockAppSync.cancelFundingSource).first()
      expect(inputArgs).toStrictEqual<typeof inputArgs>({
        id: EntityDataFactory.fundingSource.id,
      })
      verify(mockAppSync.cancelFundingSource(anything())).once()
    })
  })
})
