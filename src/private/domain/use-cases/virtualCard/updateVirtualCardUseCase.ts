import { NotSignedInError } from '@sudoplatform/sudo-common'
import { APIResult } from '../../../..'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { VirtualCardService } from '../../entities/virtualCard/virtualCardService'
import {
  VirtualCardSealedAttributesUseCaseOutput,
  VirtualCardUseCaseOutput,
} from './outputs'
import { VirtualCardBillingAddress } from './virtualCardBillingAddress'

interface UpdateVirtualCardUseCaseInput {
  id: string
  expectedCardVersion?: number
  cardHolder: string
  alias: string
  billingAddress: VirtualCardBillingAddress | undefined
}

type UpdateVirtualCardUseCaseOutput = APIResult<
  VirtualCardUseCaseOutput,
  VirtualCardSealedAttributesUseCaseOutput
>

export class UpdateVirtualCardUseCase {
  constructor(
    private readonly virtualCardService: VirtualCardService,
    private readonly userService: SudoUserService,
  ) {}
  async execute(
    input: UpdateVirtualCardUseCaseInput,
  ): Promise<UpdateVirtualCardUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.virtualCardService.updateVirtualCard(input)
  }
}
