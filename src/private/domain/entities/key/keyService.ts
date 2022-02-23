import { CreateKeyIfAbsentResult } from '../../../..'

export interface KeyService {
  createSymmetricKeyIfAbsent(): Promise<CreateKeyIfAbsentResult>
  createAndRegisterKeyPairIfAbsent(): Promise<CreateKeyIfAbsentResult>
}
