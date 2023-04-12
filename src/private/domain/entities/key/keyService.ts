/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateKeyIfAbsentResult } from '../../../../public/typings/createKeysIfAbsentResult'

export interface KeyService {
  createSymmetricKeyIfAbsent(): Promise<CreateKeyIfAbsentResult>
  createAndRegisterKeyPairIfAbsent(): Promise<CreateKeyIfAbsentResult>
}
