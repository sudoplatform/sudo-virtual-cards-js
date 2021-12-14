import { VirtualCard } from './virtualCard'

/**
 * Provisional Virtual Card. Transitive state while card is being provisioned.
 *
 * See {@link VirtualCard} for more.
 *
 * @property {string} id Identifier of the provisional card.
 * @property {string} owner Owner Identifier of the provisional card.
 * @property {number} version Current version record of the provisional card.
 * @property {Date} createdAt Date of when the provisional card was created.
 * @property {Date} updatedAt Date of when the provisional card was last updated.
 * @property {string} clientRefId Client Reference Identifier.
 * @property {ProvisioningState} provisioningState State of the provisional card.
 * @property {VirtualCard[] | undefined} card 1 to many copies of the sealed card per key.
 */
export interface ProvisionalVirtualCard {
  id: string
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
  clientRefId: string
  provisioningState: ProvisioningState
  card: VirtualCard | undefined
}

/**
 * State of provisioning.
 */
export enum ProvisioningState {
  Provisioning = 'PROVISIONING',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
}
