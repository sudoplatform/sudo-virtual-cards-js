import { BankAccountType } from './bankAccountType'

/**
 * Data describing a sandbox Plaid sandbox returned by
 * the `sandboxGetPlaidData` method.
 */
export interface PlaidAccountMetadata {
  /** Plaid account ID for passing in completion data to completeFundingSource */
  accountId: string

  /** Account sub type */
  subtype: BankAccountType
}
