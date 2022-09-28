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

interface ListTransactionsByCardIdUseCaseInput {
  cardId: string
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
  dateRange?: DateRange
  sortOrder?: SortOrder
}

type ListTransactionsByCardIdUseCaseOutput = ListOperationResult<
  TransactionUseCaseOutput,
  TransactionSealedAttributesUseCaseOutput
>
export class ListTransactionsByCardIdUseCase {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly userService: SudoUserService,
  ) {}

  async execute(
    input: ListTransactionsByCardIdUseCaseInput,
  ): Promise<ListTransactionsByCardIdUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.transactionService.listTransactionsByCardId(input)
  }
}
