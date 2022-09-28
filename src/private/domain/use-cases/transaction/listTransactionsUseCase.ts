import {
  CachePolicy,
  ListOperationResult,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import { DateRange } from '../../../../public/typings/dateRange'
import { SortOrder } from '../../../../public/typings/sortOrder'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { TransactionService } from '../../entities/transaction/transactionService'
import { TransactionSealedAttributesUseCaseOutput } from './listTransactionsCommon'
import { TransactionUseCaseOutput } from './outputs'

interface ListTransactionsUseCaseInput {
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
  dateRange?: DateRange
  sortOrder?: SortOrder
}

type ListTransactionsUseCaseOutput = ListOperationResult<
  TransactionUseCaseOutput,
  TransactionSealedAttributesUseCaseOutput
>

export class ListTransactionsUseCase {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly userService: SudoUserService,
  ) {}

  async execute(
    input: ListTransactionsUseCaseInput,
  ): Promise<ListTransactionsUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.transactionService.listTransactions(input)
  }
}
