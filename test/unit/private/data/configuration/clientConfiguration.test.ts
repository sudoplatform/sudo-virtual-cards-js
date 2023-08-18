/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Base64, FatalError } from '@sudoplatform/sudo-common'
import {
  decodeClientApplicationConfiguration,
  decodeFundingSourceClientConfiguration,
} from '../../../../../src/private/data/configuration/clientConfiguration'
import { ApiDataFactory } from '../../../data-factory/api'
import { EntityDataFactory } from '../../../data-factory/entity'

describe('Client Configuration Test Suite', () => {
  describe('decodeFundingSourceClientConfiguration', () => {
    it('should decode successfully', () => {
      expect(
        decodeFundingSourceClientConfiguration(
          EntityDataFactory.configurationData.fundingSourceClientConfiguration!
            .data,
        ),
      ).toEqual(
        ApiDataFactory.configurationData.fundingSourceClientConfiguration,
      )
    })

    it('should throw a FatalError if encoded config data is not valid JSON', () => {
      let caught: Error | undefined
      let decoded: any
      try {
        decoded = decodeFundingSourceClientConfiguration(
          Base64.encodeString('this is not JSON'),
        )
      } catch (err) {
        caught = err as Error
      }
      expect(decoded).toBeUndefined()
      expect(caught).toBeDefined()
      expect(caught).toBeInstanceOf(FatalError)
      expect(caught?.message).toEqual(
        'funding source client configuration cannot be decoded: JSON parsing failed: this is not JSON: Unexpected token h in JSON at position 1',
      )
    })
  })

  describe('decodeClientApplicationConfiguration', () => {
    it('should decode successfully', () => {
      expect(
        decodeClientApplicationConfiguration(
          EntityDataFactory.configurationData.clientApplicationConfiguration!
            .data,
        ),
      ).toEqual(ApiDataFactory.configurationData.clientApplicationConfiguration)
    })

    it('should throw a FatalError if encoded config data is not valid JSON', () => {
      let caught: Error | undefined
      let decoded: any
      try {
        decoded = decodeClientApplicationConfiguration(
          Base64.encodeString('this is not JSON'),
        )
      } catch (err) {
        caught = err as Error
      }
      expect(decoded).toBeUndefined()
      expect(caught).toBeDefined()
      expect(caught).toBeInstanceOf(FatalError)
      expect(caught?.message).toEqual(
        'client application configuration cannot be decoded: JSON parsing failed: this is not JSON: Unexpected token h in JSON at position 1',
      )
    })
  })
})
