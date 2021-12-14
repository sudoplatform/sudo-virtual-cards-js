import { SudoUserClient } from '@sudoplatform/sudo-user'
import { SudoUserService } from '../../domain/entities/sudoUser/sudoUserService'

export class DefaultSudoUserService implements SudoUserService {
  constructor(private readonly userClient: SudoUserClient) {}
  async isSignedIn(): Promise<boolean> {
    return await this.userClient.isSignedIn()
  }
}
