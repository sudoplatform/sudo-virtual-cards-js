import { StringFilter } from '@sudoplatform/sudo-common'

/**
 * Filter for provisional card.
 *
 * @property {StringFilter} id Identifier String filter.
 * @property {StringFilter} owner Owner Identifier String filter.
 * @property {StringFilter} clientRefId Client Reference Identifier String filter.
 */
export interface ProvisionalCardFilter {
  id?: StringFilter
  owner?: StringFilter
  clientRefId?: StringFilter
}

/**
 * Filter for virtual card.
 *
 * @property {StringFilter} id Identifier String filter.
 * @property {StringFilter} owner Owner Identifier String filter.
 * @property {StringFilter} keyId Key Identifier String filter.
 * @property {StringFilter} state State String filter.
 */
export interface VirtualCardFilter {
  id?: StringFilter
  owner?: StringFilter
  keyId?: StringFilter
  state?: StringFilter
}

/**
 * Filter for transactions.
 *
 * @property {StringFilter} id Identifier String filter.
 * @property {StringFilter} owner Owner String filter.
 * @property {StringFilter} cardId Card Identifier String filter.
 */
export interface TransactionFilter {
  id?: StringFilter
  owner?: StringFilter
  cardId?: StringFilter
}
