import { DefaultApiClientManager } from '@sudoplatform/sudo-api-client'
import { DefaultConfigurationManager, Logger } from '@sudoplatform/sudo-common'
import {
  DefaultSudoEntitlementsClient,
  SudoEntitlementsClient,
} from '@sudoplatform/sudo-entitlements'
import { DefaultSudoEntitlementsAdminClient } from '@sudoplatform/sudo-entitlements-admin'
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

interface SetupVirtualCardsClientOutput {
  sudo: Sudo
  ownershipProofToken: string
  virtualCardsClient: SudoVirtualCardsClient
  virtualCardsSimulatorClient: SudoVirtualCardsSimulatorClient
  userClient: SudoUserClient
  entitlementsClient: SudoEntitlementsClient
  identityVerificationClient: SudoSecureIdVerificationClient
  profilesClient: SudoProfilesClient
  fundingSourceProviders: FundingSourceProviders
}

export const setupVirtualCardsClient = async (
  log: Logger,
): Promise<SetupVirtualCardsClientOutput> => {
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
    await new EntitlementsBuilder()
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

    const virtualCardsSimulatorClient =
      new DefaultSudoVirtualCardsSimulatorClient({
        appSyncClient: setupSimulatorApiClient(),
      })

    const options: SudoVirtualCardsClientPrivateOptions = {
      sudoUserClient: userClient,
      apiClient,
    }

    const virtualCardsClient = new DefaultSudoVirtualCardsClient(options)

    return {
      ownershipProofToken,
      virtualCardsClient,
      virtualCardsSimulatorClient,
      userClient,
      entitlementsClient,
      identityVerificationClient,
      profilesClient,
      sudo,
      fundingSourceProviders: await getFundingSourceProviders(
        virtualCardsClient,
      ),
    }
  } catch (err) {
    log.error(`${setupVirtualCardsClient.name} FAILED`)
    throw err
  }
}
