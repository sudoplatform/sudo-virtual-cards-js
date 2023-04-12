/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subset } from '@sudoplatform/sudo-common'

/**
 * Result Status from API.
 *
 */
export enum APIResultStatus {
  Success = 'Success',
  Partial = 'Partial',
}

/**
 * Successful state of API Result.
 *
 * @property {APIResultStatus.Success} status Success status.
 * @property {T} result Result of the API.
 */
export interface APISuccess<T> {
  status: APIResultStatus.Success
  result: T
}

/**
 * Partial state of API Result.
 *
 * @property {APIResultStatus.Partial} status Partial status.
 * @property {Omit<T, keyof S>} result Result of the API.
 * @property {Error} cause Cause of the error to return the partial result.
 */
export interface APIPartial<T, S> {
  status: APIResultStatus.Partial
  result: Omit<T, keyof S>
  cause: Error
}

/**
 * API Result.
 *
 * Used when a result only partially fails (such as unsealing).
 */
export type APIResult<T, S extends Subset<S, T> = T> =
  | APISuccess<T>
  | APIPartial<T, S>
