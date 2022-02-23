import { NotSignedInError } from '@sudoplatform/sudo-common'
import { ProvisioningState } from '../../../..'
import { Metadata } from '../../../../public/typings/metadata'
import { SudoUserService } from '../../entities/sudoUser/sudoUserService'
import { VirtualCardService } from '../../entities/virtualCard/virtualCardService'
import { VirtualCardUseCaseOutput } from './outputs'
import { VirtualCardBillingAddress } from './virtualCardBillingAddress'

interface ProvisionVirtualCardUseCaseInput {
  clientRefId?: string
  ownershipProofs: string[]
  fundingSourceId: string
  cardHolder: string
  currency: string
  billingAddress?: VirtualCardBillingAddress
  metadata?: Metadata
  /** @deprecated Use an alias property in metadata instead */
  alias?: string
}

interface ProvisionVirtualCardUseCaseOutput {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  clientRefId: string
  provisioningState: ProvisioningState
  card: VirtualCardUseCaseOutput | undefined
}

export class ProvisionVirtualCardUseCase {
  constructor(
    private readonly virtualCardService: VirtualCardService,
    private readonly userService: SudoUserService,
  ) {}
  async execute(
    input: ProvisionVirtualCardUseCaseInput,
  ): Promise<ProvisionVirtualCardUseCaseOutput> {
    if (!(await this.userService.isSignedIn())) {
      throw new NotSignedInError()
    }
    return await this.virtualCardService.provisionVirtualCard(input)
  }
}
