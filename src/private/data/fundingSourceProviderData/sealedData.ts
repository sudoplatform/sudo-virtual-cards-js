/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import * as tt from 'io-ts-types'

const BankAccountFundingSourceInstitutionLogoRequiredProps = {
  type: t.string,
  data: t.string,
}

// eslint-disable-next-line tree-shaking/no-side-effects-in-initialization
export const BankAccountFundingSourceInstitutionLogoCodec = t.strict(
  BankAccountFundingSourceInstitutionLogoRequiredProps,
  'BankAccountFundingSourceInstitutionLogo',
)

export function decodeBankAccountFundingSourceInstitutionLogo(
  s: string,
): t.Validation<typeof BankAccountFundingSourceInstitutionLogoCodec._A> {
  const decodedJson = tt.JsonFromString.decode(s)
  if (isLeft(decodedJson)) {
    return decodedJson
  }
  return BankAccountFundingSourceInstitutionLogoCodec.decode(decodedJson.right)
}
