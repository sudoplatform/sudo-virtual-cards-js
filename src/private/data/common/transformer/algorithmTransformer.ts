import {
  EncryptionAlgorithm,
  UnrecognizedAlgorithmError,
} from '@sudoplatform/sudo-common'
import { KeyType } from '../deviceKeyWorker'

export class AlgorithmTransformer {
  public static toEncryptionAlgorithm(
    keyType: KeyType,
    algorithm: string,
  ): EncryptionAlgorithm {
    switch (keyType) {
      case KeyType.SymmetricKey: {
        switch (algorithm) {
          case 'AES/CBC/PKCS7Padding':
            return EncryptionAlgorithm.AesCbcPkcs7Padding
          case 'AES/GCM/NoPadding':
            return EncryptionAlgorithm.AesGcmNoPadding
          default:
            throw new UnrecognizedAlgorithmError(
              `Symmetric encryption algorithm not supported: ${algorithm}`,
            )
        }
      }

      case KeyType.KeyPair:
      case KeyType.PrivateKey: {
        switch (algorithm) {
          case 'RSAEncryptionOAEPAESCBC':
            return EncryptionAlgorithm.RsaOaepSha1
          default:
            throw new UnrecognizedAlgorithmError(
              `Asymmetric encryption algorithm not supported: ${algorithm}`,
            )
        }
      }
    }
  }
}
