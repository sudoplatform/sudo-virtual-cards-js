import { DefaultLogger, Logger } from '@sudoplatform/sudo-common'
import { SudoEntitlementsClient } from '@sudoplatform/sudo-entitlements'

export class EntitlementsBuilder {
  private entitlementsClient?: SudoEntitlementsClient
  private log: Logger = new DefaultLogger(this.constructor.name)

  setEntitlementsClient(
    entitlementsClient: SudoEntitlementsClient,
  ): EntitlementsBuilder {
    this.entitlementsClient = entitlementsClient
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
    const redeemedEntitlements =
      await this.entitlementsClient.redeemEntitlements()
    this.log.debug('redeemed entitlements', { redeemedEntitlements })
    this.log.debug('redeemed entitlements details', {
      redeemedDetails: redeemedEntitlements.entitlements,
    })
  }
}
