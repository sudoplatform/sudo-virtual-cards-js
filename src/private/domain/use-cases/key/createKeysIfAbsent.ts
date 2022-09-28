import { NotSignedInError } from '@sudoplatform/sudo-common'
import { CreateKeysIfAbsentResult } from '../../../../public/typings/createKeysIfAbsentResult'
import { KeyService } from '../../entities/key/keyService'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'

export type CreateKeysIfAbsentUseCaseOutput = CreateKeysIfAbsentResult

export class CreateKeysIfAbsentUseCase {
  public constructor(
    private readonly userService: SudoUserService,
    private readonly keyService: KeyService,
  ) {}

  public async execute(): Promise<CreateKeysIfAbsentUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }

    const [symmetricKeyResult, keyPairResult] = await Promise.all([
      this.keyService.createSymmetricKeyIfAbsent(),
      this.keyService.createAndRegisterKeyPairIfAbsent(),
    ])

    return {
      symmetricKey: symmetricKeyResult,
      keyPair: keyPairResult,
    }
  }
}
