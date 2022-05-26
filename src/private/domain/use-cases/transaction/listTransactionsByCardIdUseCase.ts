import {
  CachePolicy,
  ListOperationResult,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import { DateRange, DeclineReason, SortOrder } from '../../../..'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { TransactionService } from '../../entities/transaction/transactionService'
import { TransactionUseCaseOutput } from './outputs'

interface ListTransactionsByCardIdUseCaseInput {
  cardId: string
  cachePolicy?: CachePolicy
  limit?: number
  nextToken?: string
  dateRange?: DateRange
  sortOrder?: SortOrder
}

interface CurrencyAmountUseCaseOutput {
  currency: string
  amount: number
}

interface TransactionDetailChargeUseCaseOutput {
  virtualCardAmount: CurrencyAmountUseCaseOutput
  markup: {
    percent: number
    flat: number
    minCharge?: number
  }
  markupAmount: CurrencyAmountUseCaseOutput
  fundingSourceAmount: CurrencyAmountUseCaseOutput
  fundingSourceId: string
  description: string
}

interface TransactionSealedAttributesUseCaseOutput {
  billedAmount: CurrencyAmountUseCaseOutput
  transactedAmount: CurrencyAmountUseCaseOutput
  description: string
  transactedAtEpochMs: undefined
  transactedAt: Date
  settledAt?: Date
  declineReason?: DeclineReason
  detail?: TransactionDetailChargeUseCaseOutput[]
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
