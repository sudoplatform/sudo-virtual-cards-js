import { Base64, FatalError, isJsonRecord } from '@sudoplatform/sudo-common'
import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import {
  FundingSourceType,
  ProvisionalFundingSourceProvisioningData,
} from '../../../public/typings/fundingSource'

/* eslint-disable tree-shaking/no-side-effects-in-initialization */
const BaseProvisionalFundingSourceProvisioningDataProperties = {
  provider: t.string,
  version: t.number,
  type: t.string,
}

const BaseProvisionalFundingSourceProvisioningDataCodec = t.type(
  BaseProvisionalFundingSourceProvisioningDataProperties,
  'BaseProvisionalFundingSourceProvisioningData',
)

const CheckoutCardProvisionalFundingSourceProvisioningDataProperties = {
  provider: t.literal('checkout'),
  version: t.literal(1),
  type: t.literal('CREDIT_CARD'),
}

const CheckoutCardProvisionalFundingSourceProvisioningDataCodec = t.type(
  CheckoutCardProvisionalFundingSourceProvisioningDataProperties,
  'CheckoutProvisionalFundingSourceProvisioningData',
)

const StripeCardProvisionalFundingSourceProvisioningDataRequiredProperties = {
  provider: t.literal('stripe'),
  version: t.literal(1),
  client_secret: t.string,
  intent: t.string,
}

// Wasn't originally included but now if present must be CREDIT_CARD.
const StripeCardProvisionalFundingSourceProvisioningDataOptionalProperties = {
  type: t.literal('CREDIT_CARD'),
}

const StripeCardProvisionalFundingSourceProvisioningDataCodec = t.intersection(
  [
    t.type(
      StripeCardProvisionalFundingSourceProvisioningDataRequiredProperties,
    ),
    t.partial(
      StripeCardProvisionalFundingSourceProvisioningDataOptionalProperties,
    ),
  ],
  'StripeProvisionalFundingSourceProvisioningData',
)

const ProvisionalFundingSourceProvisioningDataCodec = t.union(
  [
    CheckoutCardProvisionalFundingSourceProvisioningDataCodec,
    StripeCardProvisionalFundingSourceProvisioningDataCodec,
    BaseProvisionalFundingSourceProvisioningDataCodec,
  ],
  'ProvisionalFundingSourceProvisioningData',
)
/* eslint-enable tree-shaking/no-side-effects-in-initialization */

export function decodeProvisionalFundingSourceProvisioningData(
  provisioningData: string,
): ProvisionalFundingSourceProvisioningData {
  const msg = 'provisional funding source provisioning data cannot be decoded'

  let decodedString: string
  try {
    decodedString = Base64.decodeString(provisioningData)
  } catch (err) {
    const error = err as Error
    throw new FatalError(
      `${msg}: Base64 decoding failed: ${provisioningData}: ${error.message}`,
    )
  }

  let decodedObject: unknown
  try {
    decodedObject = JSON.parse(decodedString) as unknown
  } catch (err) {
    const error = err as Error
    throw new FatalError(
      `${msg}: JSON parsing failed: ${decodedString}: ${error.message}`,
    )
  }
  if (!isJsonRecord(decodedObject)) {
    throw new FatalError(
      `${msg}: Decoded data is not a JSON record: ${JSON.stringify(
        decodedObject,
      )}`,
    )
  }

  const decodingResult =
    ProvisionalFundingSourceProvisioningDataCodec.decode(decodedObject)

  if (isLeft(decodingResult)) {
    console.log({ decodingResult: JSON.stringify(decodedObject, null, 2) })
    const error = PathReporter.report(decodingResult).join(',')
    throw new FatalError(
      `${msg}: Decoded JSON record is not a ProvisionalFundingSourceProvisioningData: ${JSON.stringify(
        decodedObject,
      )}: ${error}`,
    )
  }
  const decoded = decodingResult.right
  if (StripeCardProvisionalFundingSourceProvisioningDataCodec.is(decoded)) {
    return {
      provider: decoded.provider,
      version: decoded.version,
      type: FundingSourceType.CreditCard,
      clientSecret: decoded.client_secret,
      intent: decoded.intent,
    }
  } else if (
    CheckoutCardProvisionalFundingSourceProvisioningDataCodec.is(decoded)
  ) {
    return {
      provider: decoded.provider,
      version: decoded.version,
      type: FundingSourceType.CreditCard,
    }
  } else {
    throw new FatalError(
      `${msg}: Unrecognized funding source type: ${decoded.provider}:${decoded.version}:${decoded.type}`,
    )
  }
}
