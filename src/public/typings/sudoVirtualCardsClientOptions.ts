/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { SudoCryptoProvider } from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'

export type SudoVirtualCardsClientOptions = {
  /** Sudo User client to use. No default */
  sudoUserClient: SudoUserClient

  /** SudoCryptoProvider to use. Default is to create a WebSudoCryptoProvider */
  sudoCryptoProvider?: SudoCryptoProvider
}
