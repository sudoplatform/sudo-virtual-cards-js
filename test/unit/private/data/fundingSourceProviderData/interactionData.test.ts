/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Base64, FatalError } from '@sudoplatform/sudo-common'
import { decodeFundingSourceInteractionData } from '../../../../../src/private/data/fundingSourceProviderData/interactionData'
import {
  CheckoutCardProvisionalFundingSourceInteractionData,
  FundingSourceType,
} from '../../../../../src/public/typings/fundingSource'

describe('Interaction Data Test Suite', () => {
  describe('decodeProvisionalFundingSourceInteractionData', () => {
    describe('for invalid error info', () => {
      it('should throw a fatal error if error info is not a JSON record', () => {
        let caught: Error | undefined
        let decoded: any
        try {
          decoded = decodeFundingSourceInteractionData(
            'this is not a JSON record',
          )
        } catch (err) {
          caught = err as Error
        }
        expect(decoded).toBeUndefined()
        expect(caught).toBeDefined()
        expect(caught).toBeInstanceOf(FatalError)
        expect(caught?.message).toEqual(
          'error info cannot be decoded as funding source interaction data: error info does not contain a JSON record with provisioningData',
        )
      })

      it('should throw a fatal error if error info provisioningData is null', () => {
        let caught: Error | undefined
        let decoded: any
        try {
          decoded = decodeFundingSourceInteractionData({
            provisioningData: null,
          })
        } catch (err) {
          caught = err as Error
        }
        expect(decoded).toBeUndefined()
        expect(caught).toBeDefined()
        expect(caught).toBeInstanceOf(FatalError)
        expect(caught?.message).toEqual(
          'error info cannot be decoded as funding source interaction data: error info does not contain a JSON record with provisioningData',
        )
      })

      it('should throw a fatal error if error info provisioningData is not a string', () => {
        let caught: Error | undefined
        let decoded: any
        try {
          decoded = decodeFundingSourceInteractionData({
            provisioningData: 1,
          })
        } catch (err) {
          caught = err as Error
        }
        expect(decoded).toBeUndefined()
        expect(caught).toBeDefined()
        expect(caught).toBeInstanceOf(FatalError)
        expect(caught?.message).toEqual(
          'error info cannot be decoded as funding source interaction data: error info does not contain a JSON record with provisioningData',
        )
      })

      it('should throw a fatal error if error info provisioningData is not decodable as Base64 encoded JSON', () => {
        let caught: Error | undefined
        let decoded: any
        try {
          decoded = decodeFundingSourceInteractionData({
            provisioningData: Base64.encodeString('this is not JSON'),
          })
        } catch (err) {
          caught = err as Error
        }
        expect(decoded).toBeUndefined()
        expect(caught).toBeDefined()
        expect(caught).toBeInstanceOf(FatalError)
        expect(caught?.message).toEqual(
          'error info cannot be decoded as funding source interaction data: Base64 decoded interaction data could not be parsed as JSON: this is not JSON: Unexpected token h in JSON at position 1',
        )
      })

      it('should throw a fatal error if error info provisioningData decoded JSON is not a JSON record', () => {
        let caught: Error | undefined
        let decoded: any
        try {
          decoded = decodeFundingSourceInteractionData({
            provisioningData: Base64.encodeString('true'),
          })
        } catch (err) {
          caught = err as Error
        }
        expect(decoded).toBeUndefined()
        expect(caught).toBeDefined()
        expect(caught).toBeInstanceOf(FatalError)
        expect(caught?.message).toEqual(
          'error info cannot be decoded as funding source interaction data: Fully decoded interaction data is not a JSON record: true',
        )
      })

      it('should throw a fatal error if error info provisioningData decoded JSON does not decode as interaction data', () => {
        let caught: Error | undefined
        let decoded: any
        try {
          decoded = decodeFundingSourceInteractionData({
            provisioningData: Base64.encodeString('{"some":"value"}'),
          })
        } catch (err) {
          caught = err as Error
        }
        expect(decoded).toBeUndefined()
        expect(caught).toBeDefined()
        expect(caught).toBeInstanceOf(FatalError)
        expect(caught?.message).toEqual(
          'error info cannot be decoded as funding source interaction data: JSON record does not match a recognized provisional funding source interaction data format: {"some":"value"}',
        )
      })

      it('should throw a fatal error for unrecognized interaction data', () => {
        let caught: Error | undefined
        let decoded: any
        try {
          decoded = decodeFundingSourceInteractionData({
            provisioningData: Base64.encodeString(
              '{"provider":"stripe","version":1,"type":"CREDIT_CARD"}',
            ),
          })
        } catch (err) {
          caught = err as Error
        }
        expect(decoded).toBeUndefined()
        expect(caught).toBeDefined()
        expect(caught).toBeInstanceOf(FatalError)
        expect(caught?.message).toEqual(
          'error info cannot be decoded as funding source interaction data: Unrecognized interaction data: stripe:1:CREDIT_CARD',
        )
      })
    })
    describe('for provider checkout', () => {
      describe('and type card', () => {
        const checkoutDataDecoded: CheckoutCardProvisionalFundingSourceInteractionData =
          {
            provider: 'checkout',
            version: 1,
            type: FundingSourceType.CreditCard,
            redirectUrl: 'https://some.com/address',
          }

        const checkoutData = {
          provider: checkoutDataDecoded.provider,
          version: checkoutDataDecoded.version,
          type: 'CREDIT_CARD',
          redirectUrl: checkoutDataDecoded.redirectUrl,
        }

        const checkoutDataString = JSON.stringify(checkoutData)
        const checkoutDataEncoded = Base64.encodeString(checkoutDataString)

        it('should decode interaction data with correct type', () => {
          expect(
            decodeFundingSourceInteractionData({
              provisioningData: checkoutDataEncoded,
            }),
          ).toEqual(checkoutDataDecoded)
        })
      })
    })
  })
})
