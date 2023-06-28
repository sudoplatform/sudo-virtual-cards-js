import { PlaidAccountMetadata } from './plaidAccountMetadata'

/**
 * Sandbox data for a specific Plaid sandbox user's accounts
 * for inclusion in completion data when calling completeFundingSource
 * to test bank account funding source creation without full integration
 * of Plaid Link.
 */
export interface SandboxPlaidData {
  /** Test accounts available for the test user specific to the sandboxGetPlaidData method */
  accountMetadata: PlaidAccountMetadata[]

  /** Token for passing in completion data to completeFundingSource */
  publicToken: string
}
