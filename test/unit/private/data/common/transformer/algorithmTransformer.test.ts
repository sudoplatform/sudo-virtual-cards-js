import {
  EncryptionAlgorithm,
  UnrecognizedAlgorithmError,
} from '@sudoplatform/sudo-common'
import { KeyType } from '../../../../../../src/private/data/common/deviceKeyWorker'
import { AlgorithmTransformer } from '../../../../../../src/private/data/common/transformer/algorithmTransformer'

describe('AlgorithmTransformer', () => {
  describe('toEncryptionAlgorithm', () => {
    describe.each`
      keyTypeName       | keyType
      ${'SymmetricKey'} | ${KeyType.SymmetricKey}
    `('for symmetric key type $keyTypeName', ({ keyType }) => {
      it.each`
        algorithm                 | expected
        ${'AES/CBC/PKCS7Padding'} | ${EncryptionAlgorithm.AesCbcPkcs7Padding}
        ${'AES/GCM/NoPadding'}    | ${EncryptionAlgorithm.AesGcmNoPadding}
      `(
        'should transform symmetric algorithm: $algorithm',
        ({ algorithm, expected }) => {
          expect(
            AlgorithmTransformer.toEncryptionAlgorithm(keyType, algorithm),
          ).toEqual(expected)
        },
      )
      it.each`
        algorithm
        ${'RSAEncryptionOAEPAESCBC'}
        ${'unknown'}
      `(
        'should throw unrecognized algorithm error for non-symmetric algorithm: $algorithm',
        ({ algorithm }) => {
          expect(() =>
            AlgorithmTransformer.toEncryptionAlgorithm(keyType, algorithm),
          ).toThrow(
            new UnrecognizedAlgorithmError(
              `Symmetric encryption algorithm not supported: ${algorithm}`,
            ),
          )
        },
      )
    })

    describe.each`
      keyTypeName     | keyType
      ${'PrivateKey'} | ${KeyType.PrivateKey}
      ${'KeyPair'}    | ${KeyType.KeyPair}
    `('for asymmetric key type $keyTypeName', ({ keyType }) => {
      it.each`
        algorithm                    | expected
        ${'RSAEncryptionOAEPAESCBC'} | ${EncryptionAlgorithm.RsaOaepSha1}
      `(
        'should transform asymmetric algorithm: $algorithm',
        ({ algorithm, expected }) => {
          expect(
            AlgorithmTransformer.toEncryptionAlgorithm(keyType, algorithm),
          ).toEqual(expected)
        },
      )

      it.each`
        algorithm
        ${'AES/CBC/PKCS7Padding'}
        ${'AES/GCM/NoPadding'}
        ${'unknown'}
      `(
        'should throw unrecognized algorithm error for non-asymmetric algorithm: $algorithm',
        ({ algorithm }) => {
          expect(() =>
            AlgorithmTransformer.toEncryptionAlgorithm(keyType, algorithm),
          ).toThrow(
            new UnrecognizedAlgorithmError(
              `Asymmetric encryption algorithm not supported: ${algorithm}`,
            ),
          )
        },
      )
    })
  })
})
