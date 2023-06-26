/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger, Logger } from '@sudoplatform/sudo-common'
import { SudoEntitlementsClient } from '@sudoplatform/sudo-entitlements'
import {
  Entitlement,
  SudoEntitlementsAdminClient,
} from '@sudoplatform/sudo-entitlements-admin'

export class EntitlementsBuilder {
  private entitlementsClient?: SudoEntitlementsClient
  private entitlementsAdminClient?: SudoEntitlementsAdminClient
  private log: Logger = new DefaultLogger(this.constructor.name)
  private entitlements: Record<string, Entitlement> = {}

  constructor(opts?: { entitlements?: Entitlement[] }) {
    this.setEntitlements([
      {
        name: 'sudoplatform.sudo.max',
        value: 3,
      },
      {
        name: 'sudoplatform.identity-verification.verifyIdentityUserEntitled',
        value: 1,
      },
      {
        name: 'sudoplatform.virtual-cards.serviceUserEntitled',
        value: 1,
      },
      {
        name: 'sudoplatform.virtual-cards.virtualCardMaxPerSudo',
        value: 5,
      },
      {
        name: 'sudoplatform.virtual-cards.virtualCardProvisionUserEntitled',
        value: 1,
      },
      {
        name: 'sudoplatform.virtual-cards.virtualCardTransactUserEntitled',
        value: 1,
      },
    ])
    if (opts?.entitlements) {
      this.setEntitlements(opts.entitlements)
    }
  }

  setEntitlementsClient(
    entitlementsClient: SudoEntitlementsClient,
  ): EntitlementsBuilder {
    this.entitlementsClient = entitlementsClient
    return this
  }

  setEntitlementsAdminClient(
    entitlementsAdminClient: SudoEntitlementsAdminClient,
  ): EntitlementsBuilder {
    this.entitlementsAdminClient = entitlementsAdminClient
    return this
  }

  setEntitlements(entitlements: Entitlement[]): EntitlementsBuilder {
    entitlements.forEach((e) => {
      this.entitlements[e.name] = e
    })
    return this
  }

  setLogger(log: Logger): EntitlementsBuilder {
    this.log = log
    return this
  }

  async apply(): Promise<void> {
    if (!this.entitlementsClient) {
      throw 'Entitlements client not set'
    }
    if (!this.entitlementsAdminClient) {
      throw 'Entitlements admin client not set'
    }
    const externalId = await this.entitlementsClient.getExternalId()

    const appliedEntitlements =
      await this.entitlementsAdminClient.applyEntitlementsToUser(
        externalId,
        Object.values(this.entitlements),
      )
    this.log.debug('applied entitlements', { appliedEntitlements })

    const redeemedEntitlements =
      await this.entitlementsClient.redeemEntitlements()
    this.log.debug('redeemed entitlements', { redeemedEntitlements })
    this.log.debug('redeemed entitlements details', {
      redeemedDetails: redeemedEntitlements.entitlements,
    })
  }
}
