/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CurrencyAmount,
  CurrencyVelocity,
  VirtualCardsConfig,
} from '../../../../gen/graphqlTypes'
import {
  ClientApplicationConfigurationEntity,
  CurrencyVelocityEntity,
  PricingPolicyEntity,
  VirtualCardsConfigEntity,
} from '../../../domain/entities/configuration/virtualCardsConfigEntity'
import { FundingSourceClientConfigurationEntity } from '../../../domain/entities/fundingSource/fundingSourceEntity'
import { CurrencyAmountEntity } from '../../../domain/entities/transaction/transactionEntity'

export class VirtualCardsConfigEntityTransformer {
  static transformGraphQL(data: VirtualCardsConfig): VirtualCardsConfigEntity {
    return {
      fundingSourceSupportInfo: data.fundingSourceSupportInfo,
      maxCardCreationVelocity: data.maxCardCreationVelocity,
      maxFundingSourceFailureVelocity: data.maxFundingSourceFailureVelocity,
      maxFundingSourcePendingVelocity:
        data.maxFundingSourcePendingVelocity ?? [],
      maxFundingSourceVelocity: data.maxFundingSourceVelocity,
      maxTransactionAmount: transformCurrencyAmount(data.maxTransactionAmount),
      maxTransactionVelocity: transformCurrencyVelocity(
        data.maxTransactionVelocity,
      ),
      virtualCardCurrencies: data.virtualCardCurrencies,
      bankAccountFundingSourceExpendableEnabled:
        data.bankAccountFundingSourceExpendableEnabled,
      bankAccountFundingSourceCreationEnabled:
        data.bankAccountFundingSourceCreationEnabled
          ? data.bankAccountFundingSourceCreationEnabled
          : undefined,
      fundingSourceClientConfiguration: data.fundingSourceClientConfiguration
        ? {
            data: (
              data.fundingSourceClientConfiguration as FundingSourceClientConfigurationEntity
            ).data,
          }
        : undefined,
      clientApplicationConfiguration: data.clientApplicationsConfiguration
        ? {
            data: (
              data.clientApplicationsConfiguration as ClientApplicationConfigurationEntity
            ).data,
          }
        : undefined,
      pricingPolicy: data.pricingPolicy
        ? {
            data: (data.pricingPolicy as PricingPolicyEntity).data,
          }
        : undefined,
    }
  }
}

function transformCurrencyAmount(
  data: CurrencyAmount[],
): CurrencyAmountEntity[] {
  const transformedEntities: CurrencyAmountEntity[] = []

  data.forEach((item) => {
    const transformed: CurrencyAmountEntity = {
      currency: item.currency,
      amount: Number(item.amount),
    }
    transformedEntities.push(transformed)
  })

  return transformedEntities
}

function transformCurrencyVelocity(
  data: CurrencyVelocity[],
): CurrencyVelocityEntity[] {
  const transformedEntities: CurrencyVelocityEntity[] = []

  data.forEach((item) => {
    const transformed: CurrencyVelocityEntity = {
      currency: item.currency,
      velocity: item.velocity,
    }
    transformedEntities.push(transformed)
  })

  return transformedEntities
}