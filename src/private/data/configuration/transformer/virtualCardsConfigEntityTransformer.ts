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
import { CurrencyAmountTransformer } from '../../common/transformer/currencyAmountTransformer'

export class VirtualCardsConfigEntityTransformer {
  static transformGraphQL(data: VirtualCardsConfig): VirtualCardsConfigEntity {
    return {
      fundingSourceSupportInfo: data.fundingSourceSupportInfo,
      maxCardCreationVelocity: data.maxCardCreationVelocity,
      maxFundingSourceFailureVelocity: data.maxFundingSourceFailureVelocity,
      maxFundingSourcePendingVelocity:
        data.maxFundingSourcePendingVelocity ?? [],
      maxFundingSourceVelocity: data.maxFundingSourceVelocity,
      maxTransactionAmount: transformCurrencyAmounts(data.maxTransactionAmount),
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

function transformCurrencyAmounts(
  data: CurrencyAmount[],
): CurrencyAmountEntity[] {
  return data.map((c) =>
    CurrencyAmountTransformer.transformToCurrencyAmountEntity(c),
  )
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
