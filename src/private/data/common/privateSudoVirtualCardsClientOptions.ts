/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { SudoKeyManager } from '@sudoplatform/sudo-common'
import { SudoVirtualCardsClientOptions } from '../../../public/typings/sudoVirtualCardsClientOptions'
import { ApiClient } from './apiClient'

/**
 * Private DefaultSudoVirtualCardsClient for describing private options
 * for supporting unit testing.
 */
export interface SudoVirtualCardsClientPrivateOptions
  extends SudoVirtualCardsClientOptions {
  apiClient?: ApiClient
  sudoKeyManager?: SudoKeyManager
}
