import { SudoKeyManager } from '@sudoplatform/sudo-common'
import { SudoVirtualCardsClientOptions } from '../../..'
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
