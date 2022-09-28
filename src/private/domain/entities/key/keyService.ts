import { CreateKeyIfAbsentResult } from '../../../../public/typings/createKeysIfAbsentResult'

export interface KeyService {
  createSymmetricKeyIfAbsent(): Promise<CreateKeyIfAbsentResult>
  createAndRegisterKeyPairIfAbsent(): Promise<CreateKeyIfAbsentResult>
}
