/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Base64,
  Buffer,
  DecodeError,
  DefaultLogger,
  DefaultSudoKeyArchive,
  EncryptionAlgorithm,
  FatalError,
  IllegalArgumentError,
  KeyNotFoundError,
  Logger,
  NotSignedInError,
  PublicKeyFormat,
  SignatureAlgorithm,
  SudoKeyManager,
} from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { v4 } from 'uuid'

export interface DeviceKey {
  id: string
  keyRingId: string
  algorithm: string
  data: string
  format: PublicKeyFormat
}

export enum KeyType {
  KeyPair,
  SymmetricKey,
  PrivateKey,
}

export interface UnsealInput {
  encrypted: string
  keyId: string
  keyType: KeyType
  algorithm?: EncryptionAlgorithm
}

export interface SealInput {
  plainText: string
  keyId: string
  keyType: KeyType
  algorithm?: EncryptionAlgorithm
}

export interface SignInput {
  plainText: string
  keyId: string
  keyType: KeyType
  algorithm?: SignatureAlgorithm
}

const SECRET_KEY_ID_KEY = 'vc-secret-key'
const KEY_PAIR_ID_KEY = 'vc-keypair'
const KEY_RING_SERVICE_NAME = 'sudo-vc'
const RSA_KEY_SIZE = 256

export interface DeviceKeyWorker {
  generateKeyPair(): Promise<DeviceKey>

  getCurrentPublicKey(): Promise<DeviceKey | undefined>

  generateCurrentSymmetricKey(): Promise<string>

  getCurrentSymmetricKeyId(): Promise<string | undefined>

  keyExists(id: string, type: KeyType): Promise<boolean>

  removeKey(id: string, type: KeyType): Promise<void>

  sealString(input: SealInput): Promise<string>

  unsealString(input: UnsealInput): Promise<string>

  signString(input: SignInput): Promise<string>

  exportKeys(): Promise<ArrayBuffer>

  importKeys(archiveData: ArrayBuffer): Promise<void>
}

export class DefaultDeviceKeyWorker implements DeviceKeyWorker {
  private readonly log: Logger

  private currentPublicKey: DeviceKey | undefined

  readonly Defaults = {
    Algorithm: 'RSAEncryptionOAEPAESCBC',
  }
  constructor(
    private readonly keyManager: SudoKeyManager,
    private readonly userClient: SudoUserClient,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

  async generateKeyPair(): Promise<DeviceKey> {
    const keyRingId = await this.getKeyRingId()
    const keyPairId = v4()
    const keyPairIdBits = new TextEncoder().encode(keyPairId)
    await this.keyManager.addPassword(keyPairIdBits.buffer, KEY_PAIR_ID_KEY)
    await this.keyManager.generateKeyPair(keyPairId)
    const publicKey = await this.keyManager.getPublicKey(keyPairId)
    if (publicKey === undefined) {
      throw new FatalError('Could not generate public key pair')
    }
    const publicKeyData = btoa(
      String.fromCharCode(...new Uint8Array(publicKey.keyData)),
    )
    return {
      id: keyPairId,
      keyRingId,
      algorithm: this.Defaults.Algorithm,
      data: publicKeyData,
      format: publicKey.keyFormat,
    }
  }

  async getCurrentPublicKey(): Promise<DeviceKey | undefined> {
    if (this.currentPublicKey) {
      return this.currentPublicKey
    }
    const keyRingId = await this.getKeyRingId()
    const keyPairIdBits = await this.keyManager.getPassword(KEY_PAIR_ID_KEY)
    const keyPairId = new TextDecoder('utf-8', { fatal: true }).decode(
      keyPairIdBits,
    )
    if (!keyPairId.length) {
      return undefined
    }
    const publicKey = await this.keyManager.getPublicKey(keyPairId)
    if (!publicKey) {
      return undefined
    }

    // Make sure we have the private key as well
    const privateKeyId = await this.keyManager.doesPrivateKeyExist(keyPairId)
    if (!privateKeyId) {
      return undefined
    }

    this.currentPublicKey = {
      id: keyPairId,
      keyRingId,
      algorithm: this.Defaults.Algorithm,
      format: publicKey.keyFormat,
      data: Base64.encode(publicKey.keyData),
    }
    return this.currentPublicKey
  }

  async generateCurrentSymmetricKey(): Promise<string> {
    const keyId = v4()
    const keyIdBits = new TextEncoder().encode(keyId)
    // We need to delete any old key id information before adding a new key.
    await this.keyManager.deletePassword(SECRET_KEY_ID_KEY)
    await this.keyManager.addPassword(keyIdBits.buffer, SECRET_KEY_ID_KEY)
    await this.keyManager.generateSymmetricKey(keyId)
    return keyId
  }

  async getCurrentSymmetricKeyId(): Promise<string | undefined> {
    const keyIdBits = await this.keyManager.getPassword(SECRET_KEY_ID_KEY)
    const keyId = new TextDecoder().decode(keyIdBits)
    if (!keyId.length) {
      return undefined
    }
    const exists = await this.keyManager.doesSymmetricKeyExist(keyId)
    if (!exists) {
      return undefined
    }

    return keyId
  }

  async keyExists(id: string, type: KeyType): Promise<boolean> {
    switch (type) {
      case KeyType.SymmetricKey:
        return await this.keyManager.doesSymmetricKeyExist(id)
      case KeyType.PrivateKey:
      case KeyType.KeyPair:
        return await this.keyManager.doesPrivateKeyExist(id)
    }
  }

  async removeKey(id: string, type: KeyType): Promise<void> {
    switch (type) {
      case KeyType.SymmetricKey:
        await this.keyManager.deleteSymmetricKey(id)
        break
      case KeyType.KeyPair:
        await this.keyManager.deleteKeyPair(id)
        break
      case KeyType.PrivateKey:
        throw new IllegalArgumentError(
          `KeyType.PrivateKey cannot be used for ${this.removeKey.name}`,
        )
    }
  }

  async unsealString({
    keyId,
    keyType,
    encrypted,
    algorithm,
  }: UnsealInput): Promise<string> {
    switch (keyType) {
      case KeyType.PrivateKey:
      case KeyType.KeyPair:
        return await this.unsealStringWithPrivateKeyId({
          keyPairId: keyId,
          encrypted,
        })
      case KeyType.SymmetricKey:
        return await this.unsealStringWithSymmetricKeyId({
          symmetricKeyId: keyId,
          encrypted,
          algorithm,
        })
    }
  }

  async sealString({
    keyId,
    keyType,
    plainText: string,
    algorithm,
  }: SealInput): Promise<string> {
    switch (keyType) {
      case KeyType.PrivateKey:
      case KeyType.KeyPair:
        throw new IllegalArgumentError(
          'Private key sealing not yet implemented',
        )
      case KeyType.SymmetricKey:
        return await this.sealStringWithSymmetricKeyId({
          symmetricKeyId: keyId,
          plainText: string,
          algorithm,
        })
    }
  }

  public async signString(input: SignInput): Promise<string> {
    switch (input.keyType) {
      case KeyType.SymmetricKey:
        throw new IllegalArgumentError('Key type must not be symmetric')

      case KeyType.PrivateKey:
      case KeyType.KeyPair:
        return this.signStringWithPrivateKeyId({
          keyPairId: input.keyId,
          plainText: input.plainText,
          algorithm: input.algorithm,
        })
    }
  }

  private async unsealStringWithSymmetricKeyId({
    symmetricKeyId,
    encrypted,
    algorithm,
  }: {
    symmetricKeyId: string
    encrypted: string
    algorithm?: EncryptionAlgorithm
  }): Promise<string> {
    const decodeEncrypted = Uint8Array.from(atob(encrypted), (c) =>
      c.charCodeAt(0),
    )
    let unsealedBuffer: ArrayBuffer
    try {
      const options = algorithm ? { algorithm } : {}
      unsealedBuffer = await this.keyManager.decryptWithSymmetricKeyName(
        symmetricKeyId,
        decodeEncrypted,
        options,
      )
    } catch (err) {
      const message = 'Could not unseal sealed payload'
      this.log.error(message, { err })
      throw err
    }
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(unsealedBuffer)
    } catch (err) {
      const message = 'Could not decode unsealed payload as UTF-8'
      this.log.error(message, { err })
      throw new DecodeError(message)
    }
  }

  private async unsealStringWithPrivateKeyId({
    keyPairId,
    encrypted,
  }: {
    keyPairId: string
    encrypted: string
  }): Promise<string> {
    const decodeEncrypted = Uint8Array.from(atob(encrypted), (c) =>
      c.charCodeAt(0),
    )
    const encryptedCipherKeyB64 = decodeEncrypted.slice(0, RSA_KEY_SIZE)
    const encryptedData = decodeEncrypted.slice(RSA_KEY_SIZE)
    if ((await this.keyManager.getPrivateKey(keyPairId)) === undefined) {
      throw new KeyNotFoundError(`Key pair id not found: ${keyPairId}`)
    }
    let cipherKey: ArrayBuffer | undefined
    try {
      cipherKey = await this.keyManager.decryptWithPrivateKey(
        keyPairId,
        encryptedCipherKeyB64,
      )
    } catch (err) {
      const message = 'Could not decrypt AES key from sealed string'
      this.log.error(message, { err })
      throw err
    }
    if (!cipherKey) {
      throw new DecodeError('Could not extract AES key from sealed string')
    }
    let unsealedBuffer: ArrayBuffer
    try {
      unsealedBuffer = await this.keyManager.decryptWithSymmetricKey(
        cipherKey,
        encryptedData,
        { algorithm: EncryptionAlgorithm.AesCbcPkcs7Padding },
      )
    } catch (err) {
      const message = 'Could not unseal sealed payload'
      this.log.error(message, { err })
      throw err
    } finally {
      // zero out our copy of the cipher key
      new Uint8Array(cipherKey).fill(0)
    }
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(unsealedBuffer)
    } catch (err) {
      const message = 'Could not decode unsealed payload as UTF-8'
      this.log.error(message, { err })
      throw new DecodeError('Could not decode unsealed payload as UTF-8')
    }
  }

  private async signStringWithPrivateKeyId({
    keyPairId,
    plainText,
    algorithm,
  }: {
    keyPairId: string
    plainText: string
    algorithm?: SignatureAlgorithm
  }): Promise<string> {
    const data = Buffer.fromString(plainText)

    try {
      const signature = await this.keyManager.generateSignatureWithPrivateKey(
        keyPairId,
        data,
        { algorithm },
      )

      return Base64.encode(signature)
    } catch (err) {
      const message = 'Could not sign string'
      this.log.error(message, { err })
      throw err
    }
  }

  private async sealStringWithSymmetricKeyId({
    symmetricKeyId,
    plainText,
    algorithm,
  }: {
    symmetricKeyId: string
    plainText: string
    algorithm?: EncryptionAlgorithm
  }): Promise<string> {
    const unsealedBuffer = Buffer.fromString(plainText)
    let sealedBuffer: ArrayBuffer
    try {
      const options = algorithm ? { algorithm } : {}
      sealedBuffer = await this.keyManager.encryptWithSymmetricKeyName(
        symmetricKeyId,
        unsealedBuffer,
        options,
      )
    } catch (err) {
      const message = 'Could not seal payload'
      this.log.error(message, { err })
      throw err
    }
    try {
      return Base64.encode(sealedBuffer)
    } catch (err) {
      const message = 'Could not encode sealed payload as Base64'
      this.log.error(message, { err })
      throw new FatalError(message)
    }
  }

  async getKeyRingId(): Promise<string> {
    const subject = await this.userClient.getSubject()
    if (!subject) {
      throw new NotSignedInError()
    }
    return `${KEY_RING_SERVICE_NAME}.${subject}`
  }

  public async exportKeys(): Promise<ArrayBuffer> {
    const keyArchive = new DefaultSudoKeyArchive(this.keyManager)
    await keyArchive.loadKeys()
    return await keyArchive.archive(undefined)
  }

  public async importKeys(archiveData: ArrayBuffer): Promise<void> {
    if (archiveData.byteLength === 0) {
      throw new IllegalArgumentError()
    }
    const unarchiver = new DefaultSudoKeyArchive(this.keyManager, {
      archiveData,
    })
    await unarchiver.unarchive(undefined)
    await unarchiver.saveKeys()
  }
}
