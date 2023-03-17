import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync'
import {
  DisableUserDocument,
  DisableUserMutation,
  DisableUserMutationVariables,
  EnableUserDocument,
  EnableUserMutation,
  EnableUserMutationVariables,
} from '../../../src/gen/graphqlTypes'

export interface ClientProps {
  jwtToken?: string
  apiKey?: string
  region: string
  graphqlUrl: string
}
export class IdentityAdminClient {
  private readonly client: AWSAppSyncClient<NormalizedCacheObject>
  public constructor({ apiKey, jwtToken, region, graphqlUrl }: ClientProps) {
    this.client = new AWSAppSyncClient({
      url: graphqlUrl,
      region: region,
      auth: apiKey
        ? {
            type: AUTH_TYPE.API_KEY,
            apiKey: apiKey,
          }
        : jwtToken
        ? {
            type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
            jwtToken,
          }
        : {
            type: AUTH_TYPE.AWS_IAM,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'aws-access-key-id',
              secretAccessKey:
                process.env.AWS_SECRET_ACCESS_KEY ?? 'aws-secret-access-key',
              sessionToken:
                process.env.AWS_SESSION_TOKEN ?? 'aws-session-token',
            },
          },
      disableOffline: true,
    })
  }

  public async enableUser(variables: EnableUserMutationVariables) {
    const result = await this.client.mutate<EnableUserMutation>({
      mutation: EnableUserDocument,
      variables,
    })

    if (result.data) {
      return result.data
    } else {
      throw Error('enableUser did not return any result.')
    }
  }

  public async disableUser(variables: DisableUserMutationVariables) {
    const result = await this.client.mutate<DisableUserMutation>({
      mutation: DisableUserDocument,
      variables,
    })

    if (result.data) {
      return result.data
    } else {
      throw Error('disableUser did not return any result.')
    }
  }
}
