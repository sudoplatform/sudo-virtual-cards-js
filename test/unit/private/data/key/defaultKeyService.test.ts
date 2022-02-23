import { EncryptionAlgorithm, PublicKeyFormat } from '@sudoplatform/sudo-common'
import {
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito'
import { v4 } from 'uuid'
import { KeyFormat } from '../../../../../src/gen/graphqlTypes'
import { ApiClient } from '../../../../../src/private/data/common/apiClient'
import {
  DeviceKey,
  DeviceKeyWorker,
} from '../../../../../src/private/data/common/deviceKeyWorker'
import { DefaultKeyService } from '../../../../../src/private/data/key/defaultKeyService'

describe('DefaultKeyService test suite', () => {
  const mockApiClient = mock<ApiClient>()
  const mockDeviceKeyWorker = mock<DeviceKeyWorker>()
  let instanceUnderTest: DefaultKeyService

  beforeEach(() => {
    reset(mockApiClient)
    reset(mockDeviceKeyWorker)

    instanceUnderTest = new DefaultKeyService(
      instance(mockApiClient),
      instance(mockDeviceKeyWorker),
    )
  })

  describe('createSymmetricKeyIfAbsent', () => {
    const symmetricKeyId = 'symmetric-key-id'

    it('should not create new key if current key is present', async () => {
      when(mockDeviceKeyWorker.getCurrentSymmetricKeyId()).thenResolve(
        symmetricKeyId,
      )
      await expect(
        instanceUnderTest.createSymmetricKeyIfAbsent(),
      ).resolves.toEqual({ created: false, keyId: symmetricKeyId })

      verify(mockDeviceKeyWorker.getCurrentSymmetricKeyId()).once()
      verify(mockDeviceKeyWorker.generateCurrentSymmetricKey()).never()
      verify(mockDeviceKeyWorker.getCurrentPublicKey()).never()
      verify(mockDeviceKeyWorker.generateKeyPair()).never()
    })

    it('should create new key if current key is not present', async () => {
      when(mockDeviceKeyWorker.getCurrentSymmetricKeyId()).thenResolve(
        undefined,
      )
      when(mockDeviceKeyWorker.generateCurrentSymmetricKey()).thenResolve(
        symmetricKeyId,
      )
      await expect(
        instanceUnderTest.createSymmetricKeyIfAbsent(),
      ).resolves.toEqual({ created: true, keyId: symmetricKeyId })

      verify(mockDeviceKeyWorker.getCurrentSymmetricKeyId()).once()
      verify(mockDeviceKeyWorker.generateCurrentSymmetricKey()).once()
      verify(mockDeviceKeyWorker.getCurrentPublicKey()).never()
      verify(mockDeviceKeyWorker.generateKeyPair()).never()
    })
  })

  describe('createAndRegisterKeyPairIfAbsent', () => {
    const keyPairId = 'key-pair-id'
    const keyRingId = 'key-ring-id'
    const owner = 'owner-id'
    const publicKey: DeviceKey = {
      id: keyPairId,
      keyRingId,
      algorithm: EncryptionAlgorithm.AesCbcPkcs7Padding,
      data: 'blah',
      format: PublicKeyFormat.SPKI,
    }
    const now = new Date()

    it('should not create new key pair nor register it if current key pair is present and registered', async () => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(publicKey)
      when(mockApiClient.getKeyRing(anything())).thenResolve({
        items: [
          {
            id: v4(),
            keyId: keyPairId,
            keyRingId,
            algorithm: publicKey.algorithm,
            createdAtEpochMs: now.getTime(),
            updatedAtEpochMs: now.getTime(),
            version: 1,
            owner,
            publicKey: 'blah',
          },
        ],
      })
      await expect(
        instanceUnderTest.createAndRegisterKeyPairIfAbsent(),
      ).resolves.toEqual({ created: false, keyId: keyPairId })

      verify(mockDeviceKeyWorker.getCurrentPublicKey()).once()

      verify(mockApiClient.createPublicKey(anything())).never()
      verify(mockDeviceKeyWorker.getCurrentSymmetricKeyId()).never()
      verify(mockDeviceKeyWorker.getCurrentSymmetricKeyId()).never()
      verify(mockDeviceKeyWorker.generateKeyPair()).never()
    })

    it('should not create new key pair nor register it if current key pair is present and registered in paginated key ring', async () => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(publicKey)
      when(mockApiClient.getKeyRing(anything())).thenResolve(
        { items: [], nextToken: 'next-token' },
        {
          items: [
            {
              id: v4(),
              keyId: keyPairId,
              keyRingId,
              algorithm: publicKey.algorithm,
              createdAtEpochMs: now.getTime(),
              updatedAtEpochMs: now.getTime(),
              version: 1,
              owner,
              publicKey: 'blah',
            },
          ],
        },
      )
      await expect(
        instanceUnderTest.createAndRegisterKeyPairIfAbsent(),
      ).resolves.toEqual({ created: false, keyId: keyPairId })

      verify(mockDeviceKeyWorker.getCurrentPublicKey()).once()
      verify(mockApiClient.getKeyRing(anything())).twice()

      verify(mockApiClient.createPublicKey(anything())).never()

      verify(mockDeviceKeyWorker.getCurrentSymmetricKeyId()).never()
      verify(mockDeviceKeyWorker.getCurrentSymmetricKeyId()).never()
      verify(mockDeviceKeyWorker.generateKeyPair()).never()
    })

    it('should register public key if current key pair is present but not registered', async () => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(publicKey)
      when(mockApiClient.getKeyRing(anything())).thenResolve({
        items: [],
      })
      await expect(
        instanceUnderTest.createAndRegisterKeyPairIfAbsent(),
      ).resolves.toEqual({ created: false, keyId: keyPairId })

      verify(mockDeviceKeyWorker.getCurrentPublicKey()).once()
      verify(mockApiClient.createPublicKey(anything())).once()
      const [actualCreatePublicKeyInput] = capture(
        mockApiClient.createPublicKey,
      ).first()
      expect(actualCreatePublicKeyInput).toEqual<
        typeof actualCreatePublicKeyInput
      >({
        algorithm: EncryptionAlgorithm.AesCbcPkcs7Padding,
        keyId: keyPairId,
        keyRingId,
        keyFormat: KeyFormat.Spki,
        publicKey: publicKey.data,
      })

      verify(mockDeviceKeyWorker.getCurrentSymmetricKeyId()).never()
      verify(mockDeviceKeyWorker.generateCurrentSymmetricKey()).never()
      verify(mockDeviceKeyWorker.generateKeyPair()).never()
    })

    it('should create and register public key if current key pair is not present', async () => {
      when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(undefined)
      when(mockDeviceKeyWorker.generateKeyPair()).thenResolve(publicKey)

      await expect(
        instanceUnderTest.createAndRegisterKeyPairIfAbsent(),
      ).resolves.toEqual({ created: true, keyId: keyPairId })

      verify(mockDeviceKeyWorker.getCurrentPublicKey()).once()
      verify(mockDeviceKeyWorker.generateKeyPair()).once()

      verify(mockApiClient.createPublicKey(anything())).once()
      const [actualCreatePublicKeyInput] = capture(
        mockApiClient.createPublicKey,
      ).first()
      expect(actualCreatePublicKeyInput).toEqual<
        typeof actualCreatePublicKeyInput
      >({
        algorithm: EncryptionAlgorithm.AesCbcPkcs7Padding,
        keyId: keyPairId,
        keyRingId,
        keyFormat: KeyFormat.Spki,
        publicKey: publicKey.data,
      })

      verify(mockDeviceKeyWorker.generateKeyPair()).once()

      verify(mockDeviceKeyWorker.getCurrentSymmetricKeyId()).never()
      verify(mockDeviceKeyWorker.generateCurrentSymmetricKey()).never()
      verify(mockApiClient.getKeyRing(anything())).never()
    })
  })
})
