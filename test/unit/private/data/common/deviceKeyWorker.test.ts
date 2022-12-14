import {
  Base64,
  DecodeError,
  EncryptionAlgorithm,
  FatalError,
  IllegalArgumentError,
  KeyNotFoundError,
  NotSignedInError,
  PublicKeyFormat,
  SignatureAlgorithm,
  SudoKeyManager,
  SymmetricEncryptionOptions,
} from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import {
  anyString,
  anything,
  capture,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when,
} from 'ts-mockito'
import { v4 } from 'uuid'
import {
  DefaultDeviceKeyWorker,
  DeviceKey,
  DeviceKeyWorker,
  KeyType,
} from '../../../../../src/private/data/common/deviceKeyWorker'
import { uuidV4Regex } from '../../../../utility/uuidV4Regex'
import { ServiceDataFactory } from '../../../data-factory/service'

describe('DeviceKeyWorker Test Suite', () => {
  let instanceUnderTest: DeviceKeyWorker
  const mockKeyManager = mock<SudoKeyManager>()
  const mockUserClient = mock<SudoUserClient>()

  function uint8ArrayFromString(s: string): Uint8Array {
    return Uint8Array.from(Buffer.from(s).values())
  }

  beforeEach(() => {
    reset(mockKeyManager)
    reset(mockUserClient)
    instanceUnderTest = new DefaultDeviceKeyWorker(
      instance(mockKeyManager),
      instance(mockUserClient),
    )
  })

  describe('generateKeyPair', () => {
    beforeEach(() => {
      when(mockUserClient.getSubject()).thenResolve('dummySubject')
      when(mockKeyManager.getPublicKey(anything())).thenResolve(
        ServiceDataFactory.sudoCommonPublicKey,
      )
    })

    it('throws FatalError if public key returns undefined after generation', async () => {
      when(mockKeyManager.getPublicKey(anything())).thenResolve(undefined)
      await expect(instanceUnderTest.generateKeyPair()).rejects.toStrictEqual(
        new FatalError('Could not generate public key pair'),
      )
      verify(mockKeyManager.generateKeyPair(anything())).once()
    })

    it('throws NotSignedInError if user client getSubject returns undefined', async () => {
      when(mockUserClient.getSubject()).thenResolve(undefined)
      await expect(instanceUnderTest.generateKeyPair()).rejects.toThrow(
        NotSignedInError,
      )
    })

    it('generates keyPair successfully', async () => {
      const deviceKey = await instanceUnderTest.generateKeyPair()
      expect(deviceKey).toMatchObject<DeviceKey>({
        id: expect.stringMatching(uuidV4Regex()),
        keyRingId: 'sudo-vc.dummySubject',
        algorithm: 'RSAEncryptionOAEPAESCBC',
        data: Base64.encode(ServiceDataFactory.sudoCommonPublicKey.keyData),
        format: PublicKeyFormat.RSAPublicKey,
      })
    })
  })

  describe('getCurrentPublicKey', () => {
    beforeEach(() => {
      when(mockKeyManager.getPassword(anything())).thenResolve(
        new TextEncoder().encode('dummyPassword'),
      )
      when(mockUserClient.getSubject()).thenResolve('dummySubject')
    })

    it('returns undefined when there is no password for "vc-keypair"', async () => {
      when(mockKeyManager.getPassword(anyString())).thenResolve(undefined)
      await expect(
        instanceUnderTest.getCurrentPublicKey(),
      ).resolves.toStrictEqual(undefined)
      verify(mockKeyManager.getPassword(anyString())).once()
      verify(mockKeyManager.getPublicKey(anyString())).never()
    })

    it('returns undefined when there is no public key for password "vc-keypair"', async () => {
      when(mockKeyManager.getPublicKey(anything())).thenResolve(undefined)
      await expect(
        instanceUnderTest.getCurrentPublicKey(),
      ).resolves.toStrictEqual(undefined)
      verify(mockKeyManager.getPassword(anyString())).once()
      verify(mockKeyManager.getPublicKey(anyString())).once()
      const [actualKey] = capture(mockKeyManager.getPublicKey).first()
      expect(actualKey).toStrictEqual('dummyPassword')
    })

    it('returns undefined when there is no private key for password "vc-keypair"', async () => {
      const keyPairId = v4()
      const keyPairIdBits = new TextEncoder().encode(keyPairId)
      when(mockKeyManager.getPassword('vc-keypair')).thenResolve(keyPairIdBits)
      when(mockKeyManager.getPublicKey(keyPairId)).thenResolve(
        ServiceDataFactory.sudoCommonPublicKey,
      )
      when(mockKeyManager.doesPrivateKeyExist(anything())).thenResolve(false)
      when(mockUserClient.getSubject()).thenResolve('dummySubject')

      await expect(
        instanceUnderTest.getCurrentPublicKey(),
      ).resolves.toBeUndefined()
      verify(mockUserClient.getSubject()).once()
      verify(mockKeyManager.getPassword(anything())).once()
      verify(mockKeyManager.getPublicKey(anything())).once()
      verify(mockKeyManager.doesPrivateKeyExist(anything())).once()
      const [actualPrivateKeyName] = capture(
        mockKeyManager.doesPrivateKeyExist,
      ).first()
      expect(actualPrivateKeyName).toEqual(keyPairId)
    })

    it('currentPublicKey is retrieved from keyManager.getPassword if it is not in memory', async () => {
      const keyPairId = v4()
      const keyPairIdBits = new TextEncoder().encode(keyPairId)
      when(mockKeyManager.getPassword('vc-keypair')).thenResolve(keyPairIdBits)
      when(mockKeyManager.getPublicKey(keyPairId)).thenResolve(
        ServiceDataFactory.sudoCommonPublicKey,
      )
      when(mockKeyManager.doesPrivateKeyExist(anything())).thenResolve(true)
      when(mockUserClient.getSubject()).thenResolve('dummySubject')

      const currentPublicKey = await instanceUnderTest.getCurrentPublicKey()
      expect(currentPublicKey?.data).toStrictEqual(
        Base64.encode(ServiceDataFactory.sudoCommonPublicKey.keyData),
      )
      verify(mockUserClient.getSubject()).once()
      verify(mockKeyManager.getPassword(anything())).once()
      verify(mockKeyManager.getPublicKey(anything())).once()
      verify(mockKeyManager.doesPrivateKeyExist(anything())).once()
      const [actualPrivateKeyName] = capture(
        mockKeyManager.doesPrivateKeyExist,
      ).first()
      expect(actualPrivateKeyName).toEqual(keyPairId)

      expect(currentPublicKey?.id).toEqual(keyPairId)
    })

    it('returns immediately if currentPublicKey is set', async () => {
      const key = ServiceDataFactory.sudoCommonPublicKey
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(instanceUnderTest as any).currentPublicKey = key
      await expect(instanceUnderTest.getCurrentPublicKey()).resolves.toBe(key)
    })
    it('throws NotSignedInError if user client cannot get subject', async () => {
      when(mockUserClient.getSubject()).thenResolve(undefined)
      await expect(instanceUnderTest.getCurrentPublicKey()).rejects.toThrow(
        NotSignedInError,
      )
    })
  })
  describe('keyExists', () => {
    it('returns false when keytype symmetric returns undefined', async () => {
      when(mockKeyManager.doesSymmetricKeyExist(anything())).thenResolve(false)

      const keyName = 'symmetric-key'
      await expect(
        instanceUnderTest.keyExists(keyName, KeyType.SymmetricKey),
      ).resolves.toBeFalsy()

      verify(mockKeyManager.doesSymmetricKeyExist(anything())).once()
      const [actualName] = capture(mockKeyManager.doesSymmetricKeyExist).first()
      expect(actualName).toEqual(keyName)
    })

    it('returns false when keytype keypair returns undefined', async () => {
      when(mockKeyManager.doesPrivateKeyExist(anything())).thenResolve(false)

      const keyName = 'key-pair'
      await expect(
        instanceUnderTest.keyExists(keyName, KeyType.KeyPair),
      ).resolves.toBeFalsy()

      verify(mockKeyManager.doesPrivateKeyExist(anything())).once()
      const [actualName] = capture(mockKeyManager.doesPrivateKeyExist).first()
      expect(actualName).toEqual(keyName)
    })

    it('returns true when keytype keypair returns key', async () => {
      when(mockKeyManager.doesPrivateKeyExist(anything())).thenResolve(true)

      const keyName = 'key-pair'
      await expect(
        instanceUnderTest.keyExists(keyName, KeyType.KeyPair),
      ).resolves.toBeTruthy()

      verify(mockKeyManager.doesPrivateKeyExist(anything())).once()
      const [actualName] = capture(mockKeyManager.doesPrivateKeyExist).first()
      expect(actualName).toEqual(keyName)
    })

    it('returns true when keytype symmetric returns key', async () => {
      when(mockKeyManager.doesSymmetricKeyExist(anything())).thenResolve(true)

      const keyName = 'symmetric-key'
      await expect(
        instanceUnderTest.keyExists(keyName, KeyType.SymmetricKey),
      ).resolves.toBeTruthy()

      verify(mockKeyManager.doesSymmetricKeyExist(anything())).once()
      const [actualName] = capture(mockKeyManager.doesSymmetricKeyExist).first()
      expect(actualName).toEqual(keyName)
    })
  })

  describe('removeKey', () => {
    it('removes symmetric key when called with KeyType SymmetricKey', async () => {
      const keyId = v4()
      await instanceUnderTest.removeKey(keyId, KeyType.SymmetricKey)
      verify(mockKeyManager.deleteSymmetricKey(anything()))
      const [args] = capture(mockKeyManager.deleteSymmetricKey).first()
      expect(args).toStrictEqual<typeof args>(keyId)
    })
    it('removes key pair when called with KeyType KeyPair', async () => {
      const keyId = v4()
      await instanceUnderTest.removeKey(keyId, KeyType.KeyPair)
      verify(mockKeyManager.deleteKeyPair(anything()))
      const [args] = capture(mockKeyManager.deleteKeyPair).first()
      expect(args).toStrictEqual<typeof args>(keyId)
    })
  })

  describe('unsealString', () => {
    beforeEach(() => {
      when(
        mockKeyManager.decryptWithPrivateKey(anything(), anything()),
      ).thenResolve(new TextEncoder().encode('decryptedPrivate'))
      when(
        mockKeyManager.decryptWithSymmetricKey(
          anything(),
          anything(),
          anything() as SymmetricEncryptionOptions,
        ),
      ).thenResolve(new TextEncoder().encode('decryptedSym'))
    })

    describe('keyType == KeyPair', () => {
      it('throws KeyNotFoundError if currentPublicKey returns undefined', async () => {
        const keyId = v4()
        when(mockKeyManager.getPrivateKey(anything())).thenResolve(undefined)
        await expect(
          instanceUnderTest.unsealString({
            encrypted: '',
            keyType: KeyType.KeyPair,
            keyId,
          }),
        ).rejects.toStrictEqual(
          new KeyNotFoundError(`Key pair id not found: ${keyId}`),
        )
      })

      it('throws DecodeError when decrypt fails', async () => {
        const error = new Error(v4())
        when(
          mockKeyManager.decryptWithPrivateKey(anything(), anything()),
        ).thenReject(error)
        await expect(
          instanceUnderTest.unsealString({
            encrypted: '',
            keyType: KeyType.KeyPair,
            keyId: '',
          }),
        ).rejects.toStrictEqual(error)
      })
      it('throws DecodeError when decrypt private key returns undefined', async () => {
        when(
          mockKeyManager.decryptWithPrivateKey(anything(), anything()),
        ).thenResolve(undefined)
        await expect(
          instanceUnderTest.unsealString({
            encrypted: '',
            keyType: KeyType.KeyPair,
            keyId: '',
          }),
        ).rejects.toStrictEqual(
          new DecodeError('Could not extract AES key from sealed string'),
        )
      })
      it('throws DecodeError when decrypt symmetric key fails', async () => {
        const error = new Error(v4())
        when(
          mockKeyManager.decryptWithSymmetricKey(
            anything(),
            anything(),
            objectContaining({
              algorithm: EncryptionAlgorithm.AesCbcPkcs7Padding,
            }) as SymmetricEncryptionOptions,
          ),
        ).thenReject(error)
        await expect(
          instanceUnderTest.unsealString({
            encrypted: '',
            keyType: KeyType.KeyPair,
            keyId: '',
          }),
        ).rejects.toStrictEqual(error)
      })
      it('calls through everything expected', async () => {
        when(
          mockKeyManager.decryptWithPrivateKey(anything(), anything()),
        ).thenResolve(new TextEncoder().encode('cipherKey'))
        await expect(
          instanceUnderTest.unsealString({
            encrypted: btoa(`${new Array(256 + 1).join('0')}aabbccddeeff`),
            keyType: KeyType.KeyPair,
            keyId: 'keyId',
          }),
        ).resolves.toStrictEqual('decryptedSym')
        verify(
          mockKeyManager.decryptWithPrivateKey(anything(), anything()),
        ).once()
        const [inputKeyId, encrypted] = capture(
          mockKeyManager.decryptWithPrivateKey,
        ).first()
        expect(inputKeyId).toStrictEqual('keyId')
        const expectedBuffer = Uint8Array.from(
          `${new Array(256 + 1).join('0')}`,
          (c) => c.charCodeAt(0),
        )
        // This is expected due to the way buffers need to be converted from Buffer -> ArrayBuffer
        expect(encrypted).toStrictEqual(expectedBuffer)
        verify(
          mockKeyManager.decryptWithSymmetricKey(
            anything(),
            anything(),
            anything() as SymmetricEncryptionOptions,
          ),
        ).once()
        const [cipherKey, encryptedData] = capture(
          mockKeyManager.decryptWithSymmetricKey,
        ).first()
        expect(cipherKey).toStrictEqual(new TextEncoder().encode('cipherKey'))
        const expectedEncryptedData = Uint8Array.from('aabbccddeeff', (c) =>
          c.charCodeAt(0),
        )
        expect(encryptedData).toStrictEqual(expectedEncryptedData)
      })
    })
    describe('keyType == SymmetricKey', () => {
      beforeEach(() => {
        when(
          mockKeyManager.decryptWithSymmetricKeyName(
            anything(),
            anything(),
            anything() as SymmetricEncryptionOptions,
          ),
        ).thenResolve(new TextEncoder().encode('aa'))
      })
      it('calls keyManager.decryptWithSymmetricKeyName correctly', async () => {
        await instanceUnderTest.unsealString({
          keyId: 'keyId',
          encrypted: btoa('encrypted'),
          keyType: KeyType.SymmetricKey,
        })
        verify(
          mockKeyManager.decryptWithSymmetricKeyName(
            anything(),
            anything(),
            anything() as SymmetricEncryptionOptions,
          ),
        ).once()
        const [actualKeyId, actualEncryptedB64] = capture(
          mockKeyManager.decryptWithSymmetricKeyName,
        ).first()
        expect(actualKeyId).toStrictEqual('keyId')
        expect(new TextDecoder().decode(actualEncryptedB64)).toStrictEqual(
          'encrypted',
        )
      })
      it('propagates if keyManager.decryptWithSymmetricKeyName throws an error', async () => {
        const error = new Error(v4())
        when(
          mockKeyManager.decryptWithSymmetricKeyName(
            anything(),
            anything(),
            anything(),
          ),
        ).thenReject(error)
        await expect(
          instanceUnderTest.unsealString({
            keyId: 'keyId',
            encrypted: btoa('encrypted'),
            keyType: KeyType.SymmetricKey,
          }),
        ).rejects.toThrow(error)
      })
    })
  })

  describe('signString', () => {
    const keyId = 'key-id'
    const stringToSign = 'string-to-sign'
    const bufferToSign = uint8ArrayFromString(stringToSign)
    const signatureString = 'signature'
    const signature = uint8ArrayFromString(signatureString)
    const signatureBase64 = Base64.encode(signature)

    it.each`
      keyType               | keyTypeName
      ${KeyType.KeyPair}    | ${'KeyPair'}
      ${KeyType.PrivateKey} | ${'PrivateKey'}
    `(
      'signs a string with key type $keyTypeName',
      async ({ keyType }: { keyType: KeyType }) => {
        when(
          mockKeyManager.generateSignatureWithPrivateKey(
            anything(),
            anything(),
            anything(),
          ),
        ).thenResolve(signature)

        await expect(
          instanceUnderTest.signString({
            plainText: stringToSign,
            keyId,
            keyType,
            algorithm: SignatureAlgorithm.RsaPkcs15Sha256,
          }),
        ).resolves.toEqual(signatureBase64)

        verify(
          mockKeyManager.generateSignatureWithPrivateKey(
            anything(),
            anything(),
            anything(),
          ),
        ).once()
        const [actualName, actualData, actualOptions] = capture(
          mockKeyManager.generateSignatureWithPrivateKey,
        ).first()
        expect(actualName).toEqual(keyId)
        expect(actualData).toEqual(bufferToSign)
        expect(actualOptions).toEqual({
          algorithm: SignatureAlgorithm.RsaPkcs15Sha256,
        })
      },
    )

    it.each`
      keyType                 | keyTypeName
      ${KeyType.SymmetricKey} | ${'SymmetricKey'}
    `(
      'throws an IllegalArgumentError for key type $keyTypeName',
      async ({ keyType }: { keyType: KeyType }) => {
        await expect(
          instanceUnderTest.signString({
            plainText: stringToSign,
            keyId,
            keyType,
            algorithm: SignatureAlgorithm.RsaPkcs15Sha256,
          }),
        ).rejects.toBeInstanceOf(IllegalArgumentError)
      },
    )
  })
})
