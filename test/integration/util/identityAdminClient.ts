/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DisableUserDocument,
  DisableUserMutation,
  DisableUserMutationVariables,
  EnableUserDocument,
  EnableUserMutation,
  EnableUserMutationVariables,
} from '../../../src/gen/graphqlTypes'
import {
  GraphQLClient,
  GraphQLClientAuthMode,
  GraphQLClientOptions,
  internal,
} from '@sudoplatform/sudo-user'

export interface ClientProps {
  jwtToken?: string
  apiKey?: string
  region: string
  graphqlUrl: string
}
export class IdentityAdminClient {
  private readonly client: GraphQLClient
  public constructor({ apiKey, jwtToken, region, graphqlUrl }: ClientProps) {
    const graphQLOptions: GraphQLClientOptions = {
      graphqlUrl,
      region,
    }
    if (jwtToken) {
      graphQLOptions.authMode = GraphQLClientAuthMode.OpenIDConnect
      graphQLOptions.tokenProvider = () => Promise.resolve(jwtToken)
    }
    if (apiKey) {
      graphQLOptions.authMode = GraphQLClientAuthMode.ApiKey
      graphQLOptions.apiKey = apiKey
    }
    if (!jwtToken && !apiKey) {
      graphQLOptions.authMode = GraphQLClientAuthMode.IAM
      graphQLOptions.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'aws-access-key-id',
        secretAccessKey:
          process.env.AWS_SECRET_ACCESS_KEY ?? 'aws-secret-access-key',
        sessionToken: process.env.AWS_SESSION_TOKEN ?? 'aws-session-token',
      }
    }
    this.client = new internal.AmplifyClient(graphQLOptions)
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
