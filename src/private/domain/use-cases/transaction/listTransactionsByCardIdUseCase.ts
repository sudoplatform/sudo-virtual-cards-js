import {
  CachePolicy,
  ListOperationResult,
  NotSignedInError,
} from '@sudoplatform/sudo-common'
import {
  DateRange,
  DeclineReason,
  SortOrder,
  TransactionFilter,
  TransactionType,
} from '../../../..'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { TransactionService } from '../../entities/transaction/transactionService'

interface ListTransactionsByCardIdUseCaseInput {
  cardId: string
  cachePolicy?: CachePolicy
  filter?: TransactionFilter
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

interface TransactionUseCaseOutput {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  transactedAt: Date
  cardId: string
  sequenceId: string
  type: TransactionType
  billedAmount: CurrencyAmountUseCaseOutput
  transactedAmount: CurrencyAmountUseCaseOutput
  description: string
  declineReason?: DeclineReason
  detail?: TransactionDetailChargeUseCaseOutput[]
}

interface TransactionSealedAttributesUseCaseOutput {
  billedAmount: CurrencyAmountUseCaseOutput
  transactedAmount: CurrencyAmountUseCaseOutput
  description: string
  transactedAtEpochMs: undefined
  transactedAt: Date
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
