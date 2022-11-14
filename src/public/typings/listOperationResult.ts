import { ListOperationResult } from '@sudoplatform/sudo-common'
import { ProvisionalVirtualCard } from './provisionalCard'
import { Transaction } from './transaction'
import { VirtualCard, VirtualCardSealedAttributes } from './virtualCard'

/**
 * The result object for list virtual cards APIs.
 *
 * - On success, contains the list of requested virtual cards.
 * - On partial success, contains the list of virtual cards that
 *   were fetched and unsealed successfully as well as the list of
 *   virtual cards that could not be unsealed successfully and
 *   the error indicating why unsealing failed. An virtual card
 *   may fail to unseal if the client version is not up to date
 *   or the required cryptographic key is missing from the client
 *   device.
 * - On failure, contains an error object indicating why the list
 *   operation failed.
 */
export type ListVirtualCardsResults = ListOperationResult<
  VirtualCard,
  VirtualCardSealedAttributes
>

/**
 * The result object for list provisional cards APIs.
 *
 * - On success, contains the list of requested provisional cards.
 * - On partial success, contains the list of provisional cards that
 *   were fetched and unsealed successfully as well as the list of
 *   provisional cards that could not be unsealed successfully and
 *   the error indicating why unsealing failed. An provisional card
 *   may fail to unseal if the client version is not up to date
 *   or the required cryptographic key is missing from the client
 *   device.
 * - On failure, contains an error object indicating why the list
 *   operation failed.
 */
export type ListProvisionalCardsResults =
  ListOperationResult<ProvisionalVirtualCard>

/**
 * The result object for list transaction APIs.
 * 
  - On Success, contains the list of requested transactions.
 * - On partial success, contains the list of transactions that
 *   were fetched and unsealed successfully as well as the list of
 *   transactions that could not be unsealed successfully and
 *   the error indicating why unsealing failed. An transactions
 *   may fail to unseal if the client version is not up to date
 *   or the required cryptographic key is missing from the client
 *   device.
 * - On failure, contains an error object indicating why the list
 *   operation failed.
 success, contains the list of transactions 
   */
export type ListTransactionsResults = ListOperationResult<Transaction>
