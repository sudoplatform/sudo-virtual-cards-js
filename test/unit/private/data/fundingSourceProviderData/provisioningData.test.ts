/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Base64, FatalError } from '@sudoplatform/sudo-common'
import { decodeProvisionalFundingSourceProvisioningData } from '../../../../../src/private/data/fundingSourceProviderData/provisioningData'
import {
  FundingSourceType,
  StripeCardProvisionalFundingSourceProvisioningData,
} from '../../../../../src/public/typings/fundingSource'

describe('Provisioning Data Test Suite', () => {
  describe('decodeProvisionalFundingSourceProvisioningData', () => {
    describe('for invalid data', () => {
      it('should throw a FatalError if encoded data is not valid JSON', () => {
        let caught: Error | undefined
        let decoded: any
        try {
          decoded = decodeProvisionalFundingSourceProvisioningData(
            Base64.encodeString('this is not JSON'),
          )
        } catch (err) {
          caught = err as Error
        }
        expect(decoded).toBeUndefined()
        expect(caught).toBeDefined()
        expect(caught).toBeInstanceOf(FatalError)
        expect(caught?.message).toContain(
          'provisional funding source provisioning data cannot be decoded: JSON parsing failed: this is not JSON: Unexpected token',
        )
      })

      it('should throw a FatalError if decoded JSON data is not a JSON record', () => {
        let caught: Error | undefined
        let decoded: any
        try {
          decoded = decodeProvisionalFundingSourceProvisioningData(
            Base64.encodeString('true'),
          )
        } catch (err) {
          caught = err as Error
        }
        expect(decoded).toBeUndefined()
        expect(caught).toBeDefined()
        expect(caught).toBeInstanceOf(FatalError)
        expect(caught?.message).toEqual(
          'provisional funding source provisioning data cannot be decoded: Decoded data is not a JSON record: true',
        )
      })

      it('should throw a FatalError if decoded JSON cannot be decoded as provisioning data', () => {
        let caught: Error | undefined
        let decoded: any
        try {
          decoded = decodeProvisionalFundingSourceProvisioningData(
            Base64.encodeString('{"some":"field"}'),
          )
        } catch (err) {
          caught = err as Error
        }
        expect(decoded).toBeUndefined()
        expect(caught).toBeDefined()
        expect(caught).toBeInstanceOf(FatalError)
        expect(caught?.message).toMatch(
          /provisional funding source provisioning data cannot be decoded: Decoded JSON record is not a ProvisionalFundingSourceProvisioningData:/,
        )
      })
    })

    describe('for provider stripe', () => {
      describe('and type card', () => {
        const stripeDataDecoded: StripeCardProvisionalFundingSourceProvisioningData =
          {
            provider: 'stripe',
            version: 1,
            type: FundingSourceType.CreditCard,
            clientSecret: 'client-secret',
            intent: 'intent',
          }
        const stripeDataNoType = {
          provider: 'stripe',
          version: 1,
          client_secret: stripeDataDecoded.clientSecret,
          intent: stripeDataDecoded.intent,
        }

        const stripeDataNoTypeString = JSON.stringify(stripeDataNoType)
        const stripeDataNoTypeEncoded = Base64.encodeString(
          stripeDataNoTypeString,
        )

        const stripeDataWithType = {
          ...stripeDataNoType,
          type: 'CREDIT_CARD',
        }

        const stripeDataWithTypeString = JSON.stringify(stripeDataWithType)
        const stripeDataWithTypeEncoded = Base64.encodeString(
          stripeDataWithTypeString,
        )

        const stripeDataWrongType = {
          ...stripeDataNoType,
          type: 'CRAZY_COIN',
        }

        const stripeDataWrongTypeString = JSON.stringify(stripeDataWrongType)
        const stripeDataWrongTypeEncoded = Base64.encodeString(
          stripeDataWrongTypeString,
        )

        const stripeDataWrongVersion = {
          ...stripeDataWithType,
          version: 2,
        }

        const stripeDataWrongVersionString = JSON.stringify(
          stripeDataWrongVersion,
        )
        const stripeDataWrongVersionEncoded = Base64.encodeString(
          stripeDataWrongVersionString,
        )

        it('should decode provisioning data without type', () => {
          expect(
            decodeProvisionalFundingSourceProvisioningData(
              stripeDataNoTypeEncoded,
            ),
          ).toEqual(stripeDataDecoded)
        })

        it('should decode provisioning data with correct type', () => {
          expect(
            decodeProvisionalFundingSourceProvisioningData(
              stripeDataWithTypeEncoded,
            ),
          ).toEqual(stripeDataDecoded)
        })

        it('should throw a FatalError if provisioning data has unrecognized type', () => {
          let caught: Error | undefined
          let decoded: any
          try {
            decoded = decodeProvisionalFundingSourceProvisioningData(
              stripeDataWrongTypeEncoded,
            )
          } catch (err) {
            caught = err as Error
          }
          expect(decoded).toBeUndefined()
          expect(caught).toBeDefined()
          expect(caught).toBeInstanceOf(FatalError)
          expect(caught?.message).toEqual(
            'provisional funding source provisioning data cannot be decoded: Unrecognized funding source type: stripe:1:CRAZY_COIN',
          )
        })

        it('should throw a FatalError if provisioning data has unrecognized version', () => {
          let caught: Error | undefined
          let decoded: any
          try {
            decoded = decodeProvisionalFundingSourceProvisioningData(
              stripeDataWrongVersionEncoded,
            )
          } catch (err) {
            caught = err as Error
          }
          expect(decoded).toBeUndefined()
          expect(caught).toBeDefined()
          expect(caught).toBeInstanceOf(FatalError)
          expect(caught?.message).toEqual(
            'provisional funding source provisioning data cannot be decoded: Unrecognized funding source type: stripe:2:CREDIT_CARD',
          )
        })
      })
    })
  })
})
