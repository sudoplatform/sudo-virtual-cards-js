import { Base64, FatalError, isJsonRecord } from '@sudoplatform/sudo-common'
import * as t from 'io-ts'
import {
  FundingSourceType,
  ProvisionalFundingSourceInteractionData,
} from '../../../public/typings/fundingSource'

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
}

const CheckoutCardProvisionalFundingSourceInteractionDataCodec = t.type(
  CheckoutCardProvisionalFundingSourceInteractionDataProperties,
  'CheckoutProvisionalFundingSourceInteractionData',
)

const ProvisionalFundingSourceInteractionDataCodec = t.union(
  [
    CheckoutCardProvisionalFundingSourceInteractionDataCodec,
    BaseProvisionalFundingSourceInteractionDataCodec,
  ],
  'ProvisionalFundingSourceInteractionData',
)
/* eslint-enable tree-shaking/no-side-effects-in-initialization */

export function decodeProvisionalFundingSourceInteractionData(
  errorInfo: unknown,
): ProvisionalFundingSourceInteractionData {
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
    }
  } else {
    throw new FatalError(
      `${msg}: Unrecognized interaction data: ${decoded.provider}:${decoded.version}:${decoded.type}`,
    )
  }
}
