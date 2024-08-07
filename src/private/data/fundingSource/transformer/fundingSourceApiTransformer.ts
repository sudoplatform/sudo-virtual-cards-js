/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { FatalError } from '@sudoplatform/sudo-common'
import {
  BankAccountFundingSource,
  CreditCardFundingSource,
  FundingSource,
  FundingSourceType,
} from '../../../../public/typings/fundingSource'
import {
  FundingSourceEntity,
  isBankAccountFundingSourceEntity,
  isCreditCardFundingSourceEntity,
} from '../../../domain/entities/fundingSource/fundingSourceEntity'

export class FundingSourceAPITransformer {
  static transformEntity(entity: FundingSourceEntity): FundingSource {
    const type = entity.type
    const commonProps = {
      id: entity.id,
      owner: entity.owner,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      currency: entity.currency,
      state: entity.state,
      flags: entity.flags,
      version: entity.version,
      transactionVelocity: entity.transactionVelocity,
    }
    if (isCreditCardFundingSourceEntity(entity)) {
      const transformed: CreditCardFundingSource = {
        ...commonProps,
        type: FundingSourceType.CreditCard,
        last4: entity.last4,
        cardType: entity.cardType,
        network: entity.network,
      }
      return transformed
    }
    if (isBankAccountFundingSourceEntity(entity)) {
      const transformed: BankAccountFundingSource = {
        ...commonProps,
        type: FundingSourceType.BankAccount,
        bankAccountType: entity.bankAccountType,
        last4: entity.last4,
        institutionName: entity.institutionName,
        institutionLogo: entity.institutionLogo,
        unfundedAmount: entity.unfundedAmount
          ? entity.unfundedAmount
          : undefined,
      }
      return transformed
    }
    throw new FatalError(`Unrecognized funding source type: ${type}`)
  }
}
