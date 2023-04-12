/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CachePolicy, NotSignedInError } from '@sudoplatform/sudo-common'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { TransactionService } from '../../entities/transaction/transactionService'
import { TransactionUseCaseOutput } from './outputs'

interface GetTransactionUseCaseInput {
  id: string
  cachePolicy?: CachePolicy
}

export class GetTransactionUseCase {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly userService: SudoUserService,
  ) {}
  async execute(
    input: GetTransactionUseCaseInput,
  ): Promise<TransactionUseCaseOutput | undefined> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.transactionService.getTransaction(input)
  }
}
