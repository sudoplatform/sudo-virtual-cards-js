/**
 * Result of requestint creation of a key if absent.
 *
 * @property {boolean} created Whether or not key needed to be created
 * @property {string} keyId ID of the key
 */
export interface CreateKeyIfAbsentResult {
  created: boolean
  keyId: string
}
