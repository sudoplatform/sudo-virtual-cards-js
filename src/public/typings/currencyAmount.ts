/**
 * Amount with related currency code.
 */

export interface CurrencyAmount {
  /**
   * ISO-3 Currency Code.
   */
  currency: string
  /**
   * Amount of currency.
   */
  amount: number
}
