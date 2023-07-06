/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CachePolicy,
  ListOperationResult,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import { TransactionType } from '../../../../public/typings'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { TransactionService } from '../../entities/transaction/transactionService'
import { TransactionSealedAttributesUseCaseOutput } from './listTransactionsCommon'
import { TransactionUseCaseOutput } from './outputs'

interface ListTransactionsByCardIdAndTypeUseCaseInput {
  cardId: string
  transactionType: TransactionType
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
}

type ListTransactionsByCardIdAndTypeUseCaseOutput = ListOperationResult<
  TransactionUseCaseOutput,
  TransactionSealedAttributesUseCaseOutput
>
export class ListTransactionsByCardIdAndTypeUseCase {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly userService: SudoUserService,
  ) {}

  async execute(
    input: ListTransactionsByCardIdAndTypeUseCaseInput,
  ): Promise<ListTransactionsByCardIdAndTypeUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.transactionService.listTransactionsByCardIdAndType(input)
  }
}
