/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrencyAmount } from '../../../../public'
import {
  CurrencyVelocity,
  VirtualCardsConfig,
} from '../../../../public/typings/virtualCardsConfig'
import {
  CurrencyVelocityEntity,
  VirtualCardsConfigEntity,
} from '../../../domain/entities/configuration/virtualCardsConfigEntity'
import { CurrencyAmountEntity } from '../../../domain/entities/transaction/transactionEntity'
import {
  decodeClientApplicationConfiguration,
  decodeFundingSourceClientConfiguration,
  decodePricingPolicy,
} from '../clientConfiguration'
import { CurrencyAmountTransformer } from '../../common/transformer/currencyAmountTransformer'

export class VirtualCardsConfigAPITransformer {
  static transformEntity(entity: VirtualCardsConfigEntity): VirtualCardsConfig {
    return {
      fundingSourceSupportInfo: entity.fundingSourceSupportInfo,
      maxCardCreationVelocity: entity.maxCardCreationVelocity,
      maxFundingSourceFailureVelocity: entity.maxFundingSourceFailureVelocity,
      maxFundingSourcePendingVelocity: entity.maxFundingSourcePendingVelocity,
      maxFundingSourceVelocity: entity.maxFundingSourceVelocity,
      maxTransactionAmount: this.transformCurrencyAmount(
        entity.maxTransactionAmount,
      ),
      maxTransactionVelocity: this.transformCurrencyVelocity(
        entity.maxTransactionVelocity,
      ),
      virtualCardCurrencies: entity.virtualCardCurrencies,
      bankAccountFundingSourceExpendableEnabled:
        entity.bankAccountFundingSourceExpendableEnabled,
      bankAccountFundingSourceCreationEnabled:
        entity.bankAccountFundingSourceCreationEnabled,
      fundingSourceClientConfiguration: entity.fundingSourceClientConfiguration
        ? decodeFundingSourceClientConfiguration(
            entity.fundingSourceClientConfiguration.data,
          )
        : [],
      clientApplicationConfiguration: entity.clientApplicationConfiguration
        ? decodeClientApplicationConfiguration(
            entity.clientApplicationConfiguration.data,
          )
        : {},
      pricingPolicy: entity.pricingPolicy
        ? decodePricingPolicy(entity.pricingPolicy.data)
        : undefined,
    }
  }

  private static transformCurrencyAmount(
    entity: CurrencyAmountEntity[],
  ): CurrencyAmount[] {
    const transformedCurrencyAmounts: CurrencyAmount[] = []

    entity.forEach((item) => {
      const transformed: CurrencyAmount =
        CurrencyAmountTransformer.transformToCurrencyAmount(item)
      transformedCurrencyAmounts.push(transformed)
    })

    return transformedCurrencyAmounts
  }

  private static transformCurrencyVelocity(
    entity: CurrencyVelocityEntity[],
  ): CurrencyVelocity[] {
    const transformedCurrencyVelocities: CurrencyVelocity[] = []

    entity.forEach((item) => {
      const transformed: CurrencyVelocity = {
        currency: item.currency,
        velocity: item.velocity,
      }
      transformedCurrencyVelocities.push(transformed)
    })

    return transformedCurrencyVelocities
  }
}
