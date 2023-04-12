/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { PublicKeyFormat } from '@sudoplatform/sudo-common'
import { KeyFormat } from '../../../gen/graphqlTypes'
import { CreateKeyIfAbsentResult } from '../../../public/typings/createKeysIfAbsentResult'
import { KeyService } from '../../domain/entities/key/keyService'
import { ApiClient } from '../common/apiClient'
import { DeviceKeyWorker } from '../common/deviceKeyWorker'

export class DefaultKeyService implements KeyService {
  public constructor(
    private readonly appSync: ApiClient,
    private readonly deviceKeyWorker: DeviceKeyWorker,
  ) {}

  async createSymmetricKeyIfAbsent(): Promise<CreateKeyIfAbsentResult> {
    let symmetricKeyId = await this.deviceKeyWorker.getCurrentSymmetricKeyId()
    let symmetricKeyCreated = false
    if (!symmetricKeyId) {
      symmetricKeyId = await this.deviceKeyWorker.generateCurrentSymmetricKey()
      symmetricKeyCreated = true
    }

    return {
      created: symmetricKeyCreated,
      keyId: symmetricKeyId,
    }
  }

  async createAndRegisterKeyPairIfAbsent(): Promise<CreateKeyIfAbsentResult> {
    let publicKey = await this.deviceKeyWorker.getCurrentPublicKey()
    let registerRequired = false
    let created = false
    if (!publicKey) {
      publicKey = await this.deviceKeyWorker.generateKeyPair()
      registerRequired = true
      created = true
    } else {
      const keyId = publicKey.id

      // Key is found locally but need to check if registered remotely
      let keyFormat: KeyFormat
      switch (publicKey.format) {
        case PublicKeyFormat.SPKI:
          keyFormat = KeyFormat.Spki
          break
        case PublicKeyFormat.RSAPublicKey:
          keyFormat = KeyFormat.RsaPublicKey
          break
      }

      const fetchedKey = await this.appSync.getPublicKey(keyId, [keyFormat])
      if (fetchedKey === undefined) {
        registerRequired = true
      }
    }

    if (registerRequired) {
      let keyFormat: KeyFormat
      switch (publicKey.format) {
        case PublicKeyFormat.SPKI:
          keyFormat = KeyFormat.Spki
          break
        case PublicKeyFormat.RSAPublicKey:
          keyFormat = KeyFormat.RsaPublicKey
          break
      }
      await this.appSync.createPublicKey({
        algorithm: publicKey.algorithm,
        keyFormat,
        keyId: publicKey.id,
        keyRingId: publicKey.keyRingId,
        publicKey: publicKey.data,
      })
    }

    return {
      created,
      keyId: publicKey.id,
    }
  }
}
