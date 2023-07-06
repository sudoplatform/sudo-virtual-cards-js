/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransactionType } from '../../../../gen/graphqlTypes'
import { TransactionType as TransactionTypeEntity } from '../../../../public'

export class TransactionTypeEntityTransformer {
  static transformToGraphQLInput(
    transactionType: TransactionTypeEntity,
  ): TransactionType {
    switch (transactionType) {
      case TransactionTypeEntity.Pending:
        return TransactionType.Pending
      case TransactionTypeEntity.Complete:
        return TransactionType.Complete
      case TransactionTypeEntity.Refund:
        return TransactionType.Refund
      case TransactionTypeEntity.Decline:
        return TransactionType.Decline
    }
  }
}
