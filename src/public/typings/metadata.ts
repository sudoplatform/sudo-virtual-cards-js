/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Explicitly typed JSON value
 */
export type Metadata =
  | boolean
  | number
  | string
  | Array<Metadata>
  | { [key: string]: Metadata }
