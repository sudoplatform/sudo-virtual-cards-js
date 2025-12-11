/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  mapGraphQLToClientError,
  VersionMismatchError,
} from '@sudoplatform/sudo-common'
import {
  CardNotFoundError,
  CardStateError,
  DuplicateFundingSourceError,
  FundingSourceCompletionDataInvalidError,
  FundingSourceNotActiveError,
  FundingSourceNotFoundError,
  FundingSourceNotSetupError,
  FundingSourceRequiresUserInteractionError,
  FundingSourceStateError,
  IdentityVerificationNotVerifiedError,
  ProvisionalFundingSourceNotFoundError,
  UnacceptableFundingSourceError,
  VelocityExceededError,
} from '../../../../public/errors'
import { decodeFundingSourceInteractionData } from '../../fundingSourceProviderData/interactionData'
import { GraphQLError } from 'graphql'

export class ErrorTransformer {
  static toClientError(
    error:
      | { errorType: string; errorInfo?: string; message: string }
      | GraphQLError,
  ): Error {
    const errorType = 'errorType' in error ? error.errorType : error.message
    switch (errorType) {
      case 'DynamoDB:ConditionalCheckFailedException':
        return new VersionMismatchError()
      case 'sudoplatform.virtual-cards.FundingSourceStateError':
        return new FundingSourceStateError(error.message)
      case 'sudoplatform.virtual-cards.FundingSourceNotSetupErrorCode':
        return new FundingSourceNotSetupError(error.message)
      case 'sudoplatform.virtual-cards.ProvisionalFundingSourceNotFoundError':
        return new ProvisionalFundingSourceNotFoundError(error.message)
      case 'sudoplatform.virtual-cards.FundingSourceNotActiveError':
        return new FundingSourceNotActiveError(error.message)
      case 'sudoplatform.virtual-cards.FundingSourceNotFoundError':
        return new FundingSourceNotFoundError(error.message)
      case 'sudoplatform.virtual-cards.FundingSourceCompletionDataInvalidError':
        return new FundingSourceCompletionDataInvalidError(error.message)
      case 'sudoplatform.virtual-cards.DuplicateFundingSourceError':
        return new DuplicateFundingSourceError(error.message)
      case 'sudoplatform.virtual-cards.UnacceptableFundingSourceError':
        return new UnacceptableFundingSourceError(error.message)
      case 'sudoplatform.virtual-cards.CardNotFoundError':
        return new CardNotFoundError(error.message)
      case 'sudoplatform.virtual-cards.CardStateError':
        return new CardStateError(error.message)
      case 'sudoplatform.virtual-cards.VelocityExceededError':
        return new VelocityExceededError(error.message)
      case 'sudoplatform.virtual-cards.FundingSourceRequiresUserInteractionError': {
        const interactionData = decodeFundingSourceInteractionData(
          'errorInfo' in error ? error.errorInfo : undefined,
        )
        return new FundingSourceRequiresUserInteractionError(interactionData)
      }

      case 'sudoplatform.IdentityVerificationNotVerifiedError':
        return new IdentityVerificationNotVerifiedError(error.message)
      default:
        return mapGraphQLToClientError(error)
    }
  }
}
