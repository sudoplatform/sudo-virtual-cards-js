/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultApiClientManager } from '@sudoplatform/sudo-api-client'
import {
  DefaultConfigurationManager,
  DefaultLogger,
} from '@sudoplatform/sudo-common'
import { DefaultSudoEntitlementsClient } from '@sudoplatform/sudo-entitlements'
import { DefaultSudoEntitlementsAdminClient } from '@sudoplatform/sudo-entitlements-admin'
import {
  DefaultSudoProfilesClient,
  Sudo,
  SudoProfilesClient,
} from '@sudoplatform/sudo-profiles'
import { DefaultSudoSecureIdVerificationClient } from '@sudoplatform/sudo-secure-id-verification'
import {
  DefaultSudoUserClient,
  TESTAuthenticationProvider,
} from '@sudoplatform/sudo-user'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync'
import fs from 'fs'
import * as t from 'io-ts'
import Stripe from 'stripe'
import { v4 } from 'uuid'
import { createSudo } from './createSudo'
import { EntitlementsBuilder } from './entitlements'
import {
  DefaultSudoVirtualCardsSimulatorClient,
  SudoVirtualCardsSimulatorClient,
} from '@sudoplatform/sudo-virtual-cards-simulator'
import {
  DefaultSudoVirtualCardsClient,
  SudoVirtualCardsClient,
  SudoVirtualCardsClientOptions,
} from '../../../src'
import { getStripe } from './getFundingSourceProviders'

export const sudoIssuer = 'sudoplatform.sudoservice'

const configFile = 'config/sudoplatformconfig.json'
const registerKeyFile = 'config/register_key.private'
const registerKeyIdFile = 'config/register_key.id'

const registerKey =
  process.env.REGISTER_KEY?.trim() ||
  fs.readFileSync(registerKeyFile).toString()
const registerKeyId =
  process.env.REGISTER_KEY_ID?.trim() ||
  fs.readFileSync(registerKeyIdFile).toString().trim()
const adminApiKey = process.env.ADMIN_API_KEY?.trim() || 'IAM'

const testAuthenticationProvider = new TESTAuthenticationProvider(
  'vc-js-test',
  registerKey,
  registerKeyId,
  { 'custom:entitlementsSet': 'TEST' },
)

const SimApiConfig = t.type({
  apiUrl: t.string,
  apiKey: t.string,
  region: t.string,
})
type SimApiConfig = t.TypeOf<typeof SimApiConfig>

const setupApiClient = (): AWSAppSyncClient<NormalizedCacheObject> => {
  const config =
    DefaultConfigurationManager.getInstance().bindConfigSet<SimApiConfig>(
      SimApiConfig,
      'vcSimulator',
    )
  return new AWSAppSyncClient({
    disableOffline: true,
    url: config.apiUrl,
    region: config.region,
    auth: {
      type: AUTH_TYPE.API_KEY,
      apiKey: config.apiKey,
    },
  })
}

interface SetupVirtualCardsClientOutput {
  sudo: Sudo
  virtualCardsSimulatorClient: SudoVirtualCardsSimulatorClient
  virtualCardsClient: SudoVirtualCardsClient
  profilesClient: SudoProfilesClient
  stripe: Stripe
}

export const setupVirtualCardsSimulatorClient = async (
  log: DefaultLogger,
): Promise<SetupVirtualCardsClientOutput> => {
  try {
    DefaultConfigurationManager.getInstance().setConfig(
      fs.readFileSync(configFile).toString(),
    )
    const userClient = new DefaultSudoUserClient({ logger: log })

    const username = await userClient.registerWithAuthenticationProvider(
      testAuthenticationProvider,
      `virtualCards-JS-SDK-${v4()}`,
    )
    log.debug('username', { username })
    const tokens = await userClient.signInWithKey()
    const client = setupApiClient()
    DefaultConfigurationManager.getInstance().setConfig(
      fs.readFileSync(configFile).toString(),
    )

    DefaultApiClientManager.getInstance().setAuthClient(userClient)
    const entitlementsClient = new DefaultSudoEntitlementsClient(userClient)
    const entitlementsAdminClient = new DefaultSudoEntitlementsAdminClient(
      adminApiKey ?? 'IAM',
    )
    await new EntitlementsBuilder()
      .setEntitlementsClient(entitlementsClient)
      .setEntitlementsAdminClient(entitlementsAdminClient)
      .setLogger(log)
      .apply()
    const profilesClient = new DefaultSudoProfilesClient({
      sudoUserClient: userClient,
    })
    await profilesClient.pushSymmetricKey(
      'virtualCardsIntegrationTest',
      '01234567890123456789',
    )
    const { sudo } = await createSudo(
      'virtualCardsIntegrationTest',
      profilesClient,
    )

    const identityVerificationClient =
      new DefaultSudoSecureIdVerificationClient({
        sudoUserClient: userClient,
      })
    await identityVerificationClient.verifyIdentity({
      firstName: 'John',
      lastName: 'Smith',
      address: '222333 Peachtree Place',
      city: 'Atlanta',
      state: 'GA',
      postalCode: '30318',
      country: 'US',
      dateOfBirth: '1975-02-28',
    })
    await userClient.refreshTokens(tokens.refreshToken)
    const virtualCardsSimulatorClient =
      new DefaultSudoVirtualCardsSimulatorClient({ appSyncClient: client })

    const options: SudoVirtualCardsClientOptions = {
      sudoUserClient: userClient,
    }

    const virtualCardsClient = new DefaultSudoVirtualCardsClient(options)

    return {
      virtualCardsSimulatorClient,
      virtualCardsClient,
      profilesClient,
      sudo,
      stripe: await getStripe(virtualCardsClient),
    }
  } catch (err) {
    log.error(`${setupVirtualCardsSimulatorClient.name} FAILED`)
    throw err
  }
}
