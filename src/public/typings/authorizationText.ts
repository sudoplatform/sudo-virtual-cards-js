/**
 * Representation of text of an authorization to be presented
 * to and agreed to by the user when adding a bank account funding
 * source. The AuthorizationText presented must be submitted as
 * part of the completion data on calling
 * {@link SudoVirtualCardsClient.completeFundingSource}
 */
export interface AuthorizationText {
  /**
   * RFC5646 language tag in which the text is written
   */
  language: string

  /**
   * The text of the authorization
   */
  content: string

  /**
   * The content type of the authorization (e.g. text/html, text/plain, ...)
   */
  contentType: string

  /**
   * Hash of the content
   */
  hash: string

  /**
   * Algorithm used to generate hash of the content. Only 'SHA-256' is
   * is currently used.
   */
  hashAlgorithm: string
}
