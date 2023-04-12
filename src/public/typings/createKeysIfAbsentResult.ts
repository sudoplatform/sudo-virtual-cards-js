/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

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

/**
 * Result for {@link SudoVirtualCardsClient#createKeysIfAbsent}
 *
 * @property {CreateKeyIfAbsentResult} symmetricKey
 *  Result of createKeysIfAbsent operation for the symmetric key
 * @property {CreateKeyIfAbsentResult} keyPair
 *  Result of createKeysIfAbsent operation for the key pair
 */
export interface CreateKeysIfAbsentResult {
  symmetricKey: CreateKeyIfAbsentResult
  keyPair: CreateKeyIfAbsentResult
}
