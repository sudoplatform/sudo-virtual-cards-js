/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { NotSignedInError } from '@sudoplatform/sudo-common'
import {
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito'
import { FundingSourceService } from '../../../../../../src/private/domain/entities/fundingSource/fundingSourceService'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import {
  CompleteFundingSourceUseCase,
  FundingSourceType,
} from '../../../../../../src/private/domain/use-cases/fundingSource/completeFundingSourceUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('CompleteFundingSourceUseCase Test Suite', () => {
  const mockFundingSourceService = mock<FundingSourceService>()
  const mockUserService = mock<SudoUserService>()

  let instanceUnderTest: CompleteFundingSourceUseCase

  beforeEach(() => {
    reset(mockFundingSourceService)
    reset(mockUserService)
    instanceUnderTest = new CompleteFundingSourceUseCase(
      instance(mockFundingSourceService),
      instance(mockUserService),
    )
    when(
      mockFundingSourceService.completeFundingSource(anything()),
    ).thenResolve(EntityDataFactory.defaultFundingSource)
    when(mockUserService.isSignedIn()).thenResolve(true)
  })

  describe('execute', () => {
    describe('for credit card', () => {
      it('throws NotSignedInError if user is not signed in', async () => {
        when(mockUserService.isSignedIn()).thenResolve(false)
        await expect(
          instanceUnderTest.execute({
            id: 'dummyId',
            completionData: { provider: 'stripe', paymentMethod: '' },
          }),
        ).rejects.toThrow(NotSignedInError)
      })

      it('calls FundingSourceService completeFundingSource', async () => {
        await instanceUnderTest.execute({
          id: 'dummyId',
          completionData: { provider: 'stripe', paymentMethod: '' },
        })
        verify(
          mockFundingSourceService.completeFundingSource(anything()),
        ).once()
        const [args] = capture(
          mockFundingSourceService.completeFundingSource,
        ).first()
        expect(args).toStrictEqual<typeof args>({
          id: 'dummyId',
          completionData: { provider: 'stripe', paymentMethod: '' },
        })
      })

      it('returns FundingSourceService result', async () => {
        when(
          mockFundingSourceService.completeFundingSource(anything()),
        ).thenResolve(EntityDataFactory.defaultFundingSource)
        await expect(
          instanceUnderTest.execute({
            id: 'dummyId',
            completionData: { provider: 'stripe', paymentMethod: '' },
          }),
        ).resolves.toStrictEqual(EntityDataFactory.defaultFundingSource)
      })
    })

    describe('for bank account', () => {
      it('throws NotSignedInError if user is not signed in', async () => {
        when(mockUserService.isSignedIn()).thenResolve(false)
        await expect(
          instanceUnderTest.execute({
            id: 'dummyId',
            completionData: {
              provider: 'checkout',
              type: FundingSourceType.BankAccount,
              publicToken: 'publicToken',
              accountId: 'accountId',
              institutionId: 'institutionId',
              authorizationText: {
                language: 'authorization-text-language',
                content: 'authorization-text',
                contentType: 'authorization-text-content-type',
                hash: 'authorization-text-hash',
                hashAlgorithm: 'authorization-text-hash-algorithm',
              },
            },
          }),
        ).rejects.toThrow(NotSignedInError)
      })

      it('calls FundingSourceService completeFundingSource', async () => {
        await instanceUnderTest.execute({
          id: 'dummyId',
          completionData: {
            provider: 'checkout',
            type: FundingSourceType.BankAccount,
            publicToken: 'publicToken',
            accountId: 'accountId',
            institutionId: 'institutionId',
            authorizationText: {
              language: 'authorization-text-language',
              content: 'authorization-text',
              contentType: 'authorization-text-content-type',
              hash: 'authorization-text-hash',
              hashAlgorithm: 'authorization-text-hash-algorithm',
            },
          },
        })
        verify(
          mockFundingSourceService.completeFundingSource(anything()),
        ).once()
        const [args] = capture(
          mockFundingSourceService.completeFundingSource,
        ).first()
        expect(args).toStrictEqual<typeof args>({
          id: 'dummyId',
          completionData: {
            provider: 'checkout',
            type: FundingSourceType.BankAccount,
            publicToken: 'publicToken',
            accountId: 'accountId',
            institutionId: 'institutionId',
            authorizationText: {
              language: 'authorization-text-language',
              content: 'authorization-text',
              contentType: 'authorization-text-content-type',
              hash: 'authorization-text-hash',
              hashAlgorithm: 'authorization-text-hash-algorithm',
            },
          },
        })
      })

      it('returns FundingSourceService result', async () => {
        when(
          mockFundingSourceService.completeFundingSource(anything()),
        ).thenResolve(EntityDataFactory.bankAccountFundingSource)
        await expect(
          instanceUnderTest.execute({
            id: 'dummyId',
            completionData: {
              provider: 'checkout',
              type: FundingSourceType.BankAccount,
              publicToken: 'publicToken',
              accountId: 'accountId',
              institutionId: 'institutionId',
              authorizationText: {
                language: 'authorization-text-language',
                content: 'authorization-text',
                contentType: 'authorization-text-content-type',
                hash: 'authorization-text-hash',
                hashAlgorithm: 'authorization-text-hash-algorithm',
              },
            },
          }),
        ).resolves.toStrictEqual(EntityDataFactory.bankAccountFundingSource)
      })
    })
  })
})
