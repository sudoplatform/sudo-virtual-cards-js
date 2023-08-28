/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Base64, FatalError, isJsonRecord } from '@sudoplatform/sudo-common'
import * as t from 'io-ts'
import {
  FundingSourceInteractionData,
  FundingSourceType,
} from '../../../public/typings/fundingSource'
import { AuthorizationTextCodec, PlaidLinkTokenCodec } from './provisioningData'

/* eslint-disable tree-shaking/no-side-effects-in-initialization */
const BaseProvisionalFundingSourceInteractionDataProperties = {
  provider: t.string,
  version: t.number,
  type: t.string,
}

const BaseProvisionalFundingSourceInteractionDataCodec = t.type(
  BaseProvisionalFundingSourceInteractionDataProperties,
  'BaseProvisionalFundingSourceInteractionData',
)

const CheckoutCardProvisionalFundingSourceInteractionDataProperties = {
  provider: t.literal('checkout'),
  version: t.literal(1),
  type: t.literal('CREDIT_CARD'),
  redirectUrl: t.string,
  successUrl: t.string,
  failureUrl: t.string,
}

const CheckoutCardProvisionalFundingSourceInteractionDataCodec = t.type(
  CheckoutCardProvisionalFundingSourceInteractionDataProperties,
  'CheckoutProvisionalFundingSourceInteractionData',
)

const CheckoutBankAccountRefreshFundingSourceInteractionDataProperties = {
  provider: t.literal('checkout'),
  version: t.literal(1),
  type: t.literal('BANK_ACCOUNT'),
  plaidLinkToken: PlaidLinkTokenCodec,
  authorizationText: t.array(AuthorizationTextCodec),
}

const CheckoutBankAccountRefreshFundingSourceInteractionDataCodec = t.type(
  CheckoutBankAccountRefreshFundingSourceInteractionDataProperties,
  'CheckoutBankAccountRefreshFundingSourceInteractionData',
)

const ProvisionalFundingSourceInteractionDataCodec = t.union(
  [
    CheckoutCardProvisionalFundingSourceInteractionDataCodec,
    CheckoutBankAccountRefreshFundingSourceInteractionDataCodec,
    BaseProvisionalFundingSourceInteractionDataCodec,
  ],
  'ProvisionalFundingSourceInteractionData',
)
/* eslint-enable tree-shaking/no-side-effects-in-initialization */

export function decodeFundingSourceInteractionData(
  errorInfo: unknown,
): FundingSourceInteractionData {
  const msg = 'error info cannot be decoded as funding source interaction data'
  if (
    !isJsonRecord(errorInfo) ||
    errorInfo.provisioningData === null ||
    typeof errorInfo.provisioningData !== 'string'
  ) {
    throw new FatalError(
      `${msg}: error info does not contain a JSON record with provisioningData`,
    )
  }

  let decodedString

  try {
    decodedString = Base64.decodeString(errorInfo.provisioningData)
  } catch (err) {
    const error = err as Error
    throw new FatalError(
      `${msg}: unable to decode interaction data as Base64: ${errorInfo.provisioningData}: ${error.message}`,
    )
  }

  let decoded
  try {
    decoded = JSON.parse(decodedString) as unknown
  } catch (err) {
    const error = err as Error
    throw new FatalError(
      `${msg}: Base64 decoded interaction data could not be parsed as JSON: ${decodedString}: ${error.message}`,
    )
  }

  if (!isJsonRecord(decoded)) {
    throw new FatalError(
      `${msg}: Fully decoded interaction data is not a JSON record: ${JSON.stringify(
        decoded,
      )}`,
    )
  }

  if (!ProvisionalFundingSourceInteractionDataCodec.is(decoded)) {
    throw new FatalError(
      `${msg}: JSON record does not match a recognized provisional funding source interaction data format: ${JSON.stringify(
        decoded,
      )}`,
    )
  }

  if (CheckoutCardProvisionalFundingSourceInteractionDataCodec.is(decoded)) {
    return {
      provider: 'checkout',
      type: FundingSourceType.CreditCard,
      version: 1,
      redirectUrl: decoded.redirectUrl,
      successUrl: decoded.successUrl,
      failureUrl: decoded.failureUrl,
    }
  } else if (
    CheckoutBankAccountRefreshFundingSourceInteractionDataCodec.is(decoded)
  ) {
    return {
      provider: 'checkout',
      type: FundingSourceType.BankAccount,
      version: 1,
      linkToken: decoded.plaidLinkToken.link_token,
      authorizationText: decoded.authorizationText,
    }
  } else {
    throw new FatalError(
      `${msg}: Unrecognized interaction data: ${decoded.provider}:${decoded.version}:${decoded.type}`,
    )
  }
}
