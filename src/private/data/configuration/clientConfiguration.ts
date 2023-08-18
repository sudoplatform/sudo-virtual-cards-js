/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Base64, FatalError } from '@sudoplatform/sudo-common'
import { FundingSourceClientConfiguration } from '../../../public/typings/fundingSource'
import { ClientApplicationConfiguration } from '../../../public/typings/virtualCardsConfig'

/**
 * Decodes the funding source client configuration data.
 *
 * @param {string} configData The funding source client configuration as a JSON string.
 * @return A list of decoded funding source configuration objects.
 */
export function decodeFundingSourceClientConfiguration(
  configData: string,
): FundingSourceClientConfiguration[] {
  const msg = 'funding source client configuration cannot be decoded'

  let decodedString: string
  try {
    decodedString = Base64.decodeString(configData)
  } catch (err) {
    const error = err as Error
    throw new FatalError(
      `${msg}: Base64 decoding failed: ${configData}: ${error.message}`,
    )
  }

  let decodedObject: {
    fundingSourceTypes: FundingSourceClientConfiguration[]
  }
  try {
    decodedObject = JSON.parse(decodedString)
  } catch (err) {
    const error = err as Error
    throw new FatalError(
      `${msg}: JSON parsing failed: ${decodedString}: ${error.message}`,
    )
  }

  return decodedObject.fundingSourceTypes
}

/**
 * Decodes the client application configuration string and extracts the
 * Web specific configuration.
 *
 * @param {string} configData The client application configuration as a JSON string.
 * @return An object containing web specific funding source provider config keyed by
 *  application name.
 */
export function decodeClientApplicationConfiguration(configData: string): {
  [applicationName: string]: ClientApplicationConfiguration
} {
  const msg = 'client application configuration cannot be decoded'
  const clientApplicationConfig: {
    [applicationName: string]: ClientApplicationConfiguration
  } = {}

  let decodedString: string
  try {
    decodedString = Base64.decodeString(configData)
  } catch (err) {
    const error = err as Error
    throw new FatalError(
      `${msg}: Base64 decoding failed: ${configData}: ${error.message}`,
    )
  }

  let decodedObject
  try {
    decodedObject = JSON.parse(decodedString)
  } catch (err) {
    const error = err as Error
    throw new FatalError(
      `${msg}: JSON parsing failed: ${decodedString}: ${error.message}`,
    )
  }

  for (const key in decodedObject) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (decodedObject.hasOwnProperty(key)) {
      const config = decodedObject[key]
      if (
        config.funding_source_providers?.plaid?.redirect_uri &&
        !config.funding_source_providers?.plaid?.app_id_association
      ) {
        if (config) {
          clientApplicationConfig[key] = config
        }
      }
    }
  }
  return clientApplicationConfig
}
