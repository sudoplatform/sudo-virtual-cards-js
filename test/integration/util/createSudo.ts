import { Sudo, SudoProfilesClient } from '@sudoplatform/sudo-profiles'

const virtualCardsAudience = 'sudoplatform.virtual-cards.virtual-card'

export const createSudo = async (
  name: string,
  profilesClient: SudoProfilesClient,
): Promise<{ sudo: Sudo; ownershipProofToken: string }> => {
  const sudo = await profilesClient.createSudo(new Sudo(name))
  if (!sudo.id) {
    throw new Error('Failed to create sudo with id')
  }
  const ownershipProofToken = await profilesClient.getOwnershipProof(
    sudo.id,
    virtualCardsAudience,
  )
  return { sudo, ownershipProofToken }
}
