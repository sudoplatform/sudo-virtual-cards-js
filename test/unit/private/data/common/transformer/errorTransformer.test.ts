import {
  IllegalArgumentError,
  ServiceError,
  VersionMismatchError,
} from '@sudoplatform/sudo-common'
import { v4 } from 'uuid'
import {
  CardNotFoundError,
  DuplicateFundingSourceError,
  FundingSourceCompletionDataInvalidError,
  FundingSourceNotFoundError,
  FundingSourceNotSetupError,
  FundingSourceStateError,
  ProvisionalFundingSourceNotFoundError,
  UnacceptableFundingSourceError,
} from '../../../../../../src'
import { ErrorTransformer } from '../../../../../../src/private/data/common/transformer/errorTransformer'

class InstanceUnderTest extends ErrorTransformer {}

describe('Error Transformer Test Suite', () => {
  const errorMsg = v4()

  it.each`
    appSyncErrorType                                                        | expectedErrorType
    ${'DynamoDB:ConditionalCheckFailedException'}
    ${new VersionMismatchError()}
    ${'sudoplatform.InvalidArgumentError'}
    ${new IllegalArgumentError()}
    ${'sudoplatform.ServiceError'}
    ${new ServiceError(errorMsg)}
    ${'sudoplatform.virtual-cards.FundingSourceStateError'}
    ${new FundingSourceStateError(errorMsg)}
    ${'sudoplatform.virtual-cards.FundingSourceNotSetupErrorCode'}
    ${new FundingSourceNotSetupError(errorMsg)}
    ${'sudoplatform.virtual-cards.ProvisionalFundingSourceNotFoundError'}
    ${new ProvisionalFundingSourceNotFoundError(errorMsg)}
    ${'sudoplatform.virtual-cards.FundingSourceCompletionDataInvalidError'}
    ${new FundingSourceCompletionDataInvalidError(errorMsg)}
    ${'sudoplatform.virtual-cards.DuplicateFundingSourceError'}
    ${new DuplicateFundingSourceError(errorMsg)}
    ${'sudoplatform.virtual-cards.UnacceptableFundingSourceError'}
    ${new UnacceptableFundingSourceError(errorMsg)}
    ${'sudoplatform.virtual-cards.FundingSourceNotFoundError'}
    ${new FundingSourceNotFoundError(errorMsg)}
    ${'sudoplatform.virtual-cards.CardNotFoundError'}
    ${new CardNotFoundError(errorMsg)}
  `(
    'converts $appSyncErrorType to $expectedErrorType',
    ({ appSyncErrorType, expectedErrorType }) => {
      const error = { errorType: appSyncErrorType, message: errorMsg } as any
      expect(InstanceUnderTest.toClientError(error)).toStrictEqual(
        expectedErrorType,
      )
    },
  )
})
