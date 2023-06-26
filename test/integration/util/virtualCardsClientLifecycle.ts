/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultApiClientManager } from '@sudoplatform/sudo-api-client'
import { DefaultConfigurationManager, Logger } from '@sudoplatform/sudo-common'
import {
  DefaultSudoEntitlementsClient,
  Entitlement,
  SudoEntitlementsClient,
} from '@sudoplatform/sudo-entitlements'
import {
  DefaultSudoEntitlementsAdminClient,
  SudoEntitlementsAdminClient,
} from '@sudoplatform/sudo-entitlements-admin'
import {
  DefaultSudoProfilesClient,
  Sudo,
  SudoProfilesClient,
} from '@sudoplatform/sudo-profiles'
import {
  DefaultSudoSecureIdVerificationClient,
  SudoSecureIdVerificationClient,
} from '@sudoplatform/sudo-secure-id-verification'
import {
  DefaultSudoUserClient,
  SudoUserClient,
  TESTAuthenticationProvider,
} from '@sudoplatform/sudo-user'
import {
  DefaultVirtualCardsAdminClient,
  SudoVirtualCardsAdminClient,
} from '@sudoplatform/sudo-virtual-cards-admin'
import {
  DefaultSudoVirtualCardsSimulatorClient,
  SudoVirtualCardsSimulatorClient,
} from '@sudoplatform/sudo-virtual-cards-simulator'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync'
import * as fs from 'fs'
import * as t from 'io-ts'
import { v4 } from 'uuid'
import {
  DefaultSudoVirtualCardsClient,
  SudoVirtualCardsClient,
} from '../../../src'
import { ApiClient } from '../../../src/private/data/common/apiClient'
import { SudoVirtualCardsClientPrivateOptions } from '../../../src/private/data/common/privateSudoVirtualCardsClientOptions'
import { createSudo } from './createSudo'
import { EntitlementsBuilder } from './entitlements'
import {
  FundingSourceProviders,
  getFundingSourceProviders,
} from './getFundingSourceProviders'
import { IdentityAdminClient } from './identityAdminClient'

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

const adminApiKeyFile = 'config/api.key'
let adminApiKey: string | undefined
if (fs.existsSync(adminApiKeyFile)) {
  adminApiKey = fs.readFileSync(adminApiKeyFile).toString().trim()
} else {
  adminApiKey = process.env.ADMIN_API_KEY?.trim() || 'IAM'
}

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
const setupSimulatorApiClient = (): AWSAppSyncClient<NormalizedCacheObject> => {
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

const IdentityAdminApiConfig = t.type({
  apiUrl: t.string,
  region: t.string,
})
type IdentityAdminApiConfig = t.TypeOf<typeof IdentityAdminApiConfig>
const setupIdentityAdminClient = (apiKey?: string): IdentityAdminClient => {
  const config =
    DefaultConfigurationManager.getInstance().bindConfigSet<IdentityAdminApiConfig>(
      IdentityAdminApiConfig,
      'adminConsoleProjectService',
    )
  return new IdentityAdminClient({
    apiKey,
    region: config.region,
    graphqlUrl: config.apiUrl,
  })
}

interface SetupVirtualCardsClientOutput {
  sudo: Sudo
  ownershipProofToken: string
  virtualCardsClient: SudoVirtualCardsClient
  virtualCardsSimulatorClient: SudoVirtualCardsSimulatorClient
  virtualCardsAdminClient: SudoVirtualCardsAdminClient
  userClient: SudoUserClient
  entitlementsClient: SudoEntitlementsClient
  entitlementsAdminClient: SudoEntitlementsAdminClient
  identityVerificationClient: SudoSecureIdVerificationClient
  profilesClient: SudoProfilesClient
  identityAdminClient: IdentityAdminClient
  fundingSourceProviders: FundingSourceProviders
  bankAccountFundingSourceExpendableEnabled: boolean
}
export type SetupVirtualCardsClientOpts = {
  log: Logger

  /**
   * Overrides for matching default entitlements.
   */
  entitlements?: Entitlement[]
}
function isSetupVirtualCardsClientOpts(
  optsOrLog: Logger | SetupVirtualCardsClientOpts,
): optsOrLog is SetupVirtualCardsClientOpts {
  return 'log' in optsOrLog && 'debug' in optsOrLog.log
}

export const setupVirtualCardsClient = async (
  optsOrLog: Logger | SetupVirtualCardsClientOpts,
): Promise<SetupVirtualCardsClientOutput> => {
  const log: Logger = isSetupVirtualCardsClientOpts(optsOrLog)
    ? optsOrLog.log
    : optsOrLog
  let entitlements = isSetupVirtualCardsClientOpts(optsOrLog)
    ? optsOrLog.entitlements ?? undefined
    : undefined

  try {
    if (!adminApiKey) {
      throw new Error('ADMIN_API_KEY must be set')
    }

    DefaultConfigurationManager.getInstance().setConfig(
      fs.readFileSync(configFile).toString(),
    )
    const userClient = new DefaultSudoUserClient({ logger: log })

    const username = await userClient.registerWithAuthenticationProvider(
      testAuthenticationProvider,
      `virtualCards-JS-SDK-${v4()}`,
    )
    log.debug('username', { username })
    await userClient.signInWithKey()

    const apiClientManager =
      DefaultApiClientManager.getInstance().setAuthClient(userClient)
    const apiClient = new ApiClient(apiClientManager)
    const entitlementsClient = new DefaultSudoEntitlementsClient(userClient)
    const entitlementsAdminClient = new DefaultSudoEntitlementsAdminClient(
      adminApiKey,
    )

    const virtualCardsSimulatorClient =
      new DefaultSudoVirtualCardsSimulatorClient({
        appSyncClient: setupSimulatorApiClient(),
      })

    const virtualCardsAdminClient = new DefaultVirtualCardsAdminClient(
      adminApiKey,
    )

    const options: SudoVirtualCardsClientPrivateOptions = {
      sudoUserClient: userClient,
      apiClient,
    }

    const virtualCardsClient = new DefaultSudoVirtualCardsClient(options)

    const identityAdminClient = setupIdentityAdminClient(adminApiKey)

    const config = await virtualCardsClient.getVirtualCardsConfig()

    if (config.bankAccountFundingSourceExpendableEnabled) {
      entitlements ??= [
        {
          name: 'sudoplatform.virtual-cards.bankAccountFundingSourceExpendable',
          value: 5,
        },
      ]
    }

    await new EntitlementsBuilder({ entitlements })
      .setEntitlementsClient(entitlementsClient)
      .setEntitlementsAdminClient(entitlementsAdminClient)
      .setLogger(log)
      .apply()
      .catch((err) => {
        console.log('Error applying entitlements', { err })
        throw err
      })

    const profilesClient = new DefaultSudoProfilesClient({
      sudoUserClient: userClient,
    })
    // Prime SudoProfiles client cache by listing first
    await profilesClient.listSudos()

    await profilesClient.pushSymmetricKey(
      'virtualCardsIntegrationTest',
      '01234567890123456789',
    )
    const { sudo, ownershipProofToken } = await createSudo(
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

    return {
      ownershipProofToken,
      virtualCardsClient,
      virtualCardsSimulatorClient,
      virtualCardsAdminClient,
      userClient,
      entitlementsClient,
      entitlementsAdminClient,
      identityVerificationClient,
      profilesClient,
      sudo,
      identityAdminClient,
      fundingSourceProviders: await getFundingSourceProviders(
        virtualCardsClient,
      ),
      bankAccountFundingSourceExpendableEnabled:
        config.bankAccountFundingSourceExpendableEnabled,
    }
  } catch (err) {
    log.error(`${setupVirtualCardsClient.name} FAILED`)
    throw err
  }
}
