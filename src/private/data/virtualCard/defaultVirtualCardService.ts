import {
  EncryptionAlgorithm,
  FatalError,
  KeyNotFoundError,
  ListOperationResult,
  ListOperationResultStatus,
  PublicKeyFormat,
  UnrecognizedAlgorithmError,
} from '@sudoplatform/sudo-common'
import _ from 'lodash'
import { v4 } from 'uuid'
import { APIResult, APIResultStatus, CardState } from '../../..'
import {
  KeyFormat,
  ProvisionalCard,
  SealedCard,
} from '../../../gen/graphqlTypes'
import { ProvisionalVirtualCardEntity } from '../../domain/entities/virtualCard/provisionalVirtualCardEntity'
import { VirtualCardEntity } from '../../domain/entities/virtualCard/virtualCardEntity'
import {
  CardServiceGetProvisionalCardInput,
  CardServiceGetVirtualCardInput,
  CardServiceListProvisionalCardsInput,
  CardServiceListVirtualCardsInput,
  VirtualCardService,
  VirtualCardServiceCancelCardInput,
  VirtualCardServiceProvisionVirtualCardInput,
  VirtualCardServiceUpdateVirtualCardUseCaseInput,
} from '../../domain/entities/virtualCard/virtualCardService'
import { ApiClient } from '../common/apiClient'
import { DeviceKey, DeviceKeyWorker, KeyType } from '../common/deviceKeyWorker'
import { FetchPolicyTransformer } from '../common/transformer/fetchPolicyTransformer'
import { ProvisionalVirtualCardEntityTransformer } from './transformer/provisionalVirtualCardEntityTransformer'
import { VirtualCardEntityTransformer } from './transformer/virtualCardEntityTransformer'

interface VirtualCardBillingAddress {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface VirtualCardExpiry {
  mm: string
  yyyy: string
}

export interface VirtualCardUnsealed {
  id: string
  owner: string
  version: number
  createdAtEpochMs: number
  updatedAtEpochMs: number
  owners: {
    id: string
    issuer: string
  }[]
  fundingSourceId: string
  currency: string
  state: CardState
  activeToEpochMs: number
  cancelledAtEpochMs?: number | null
  last4: string
  cardHolder: string
  alias: string
  pan: string
  csc: string
  billingAddress?: VirtualCardBillingAddress
  expiry: VirtualCardExpiry
}

export type ProvisionalCardUnsealed = Omit<ProvisionalCard, 'card'> & {
  card?: VirtualCardUnsealed | undefined
}

/**
 * Used to omit from the {@link ListOperationResult}.
 */
export interface VirtualCardSealedAttributes {
  cardHolder: string
  alias: string
  pan: string
  csc: string
  billingAddress?: VirtualCardBillingAddress
  expiry: VirtualCardExpiry
}

export class DefaultVirtualCardService implements VirtualCardService {
  constructor(
    private readonly appSync: ApiClient,
    private readonly deviceKeyWorker: DeviceKeyWorker,
  ) {}

  async provisionVirtualCard(
    input: VirtualCardServiceProvisionVirtualCardInput,
  ): Promise<ProvisionalVirtualCardEntity> {
    const publicKey = await this.getPublicKeyOrRegisterNewKey()
    const data = await this.appSync.provisionVirtualCard({
      alias: input.alias,
      billingAddress: input.billingAddress,
      cardHolder: input.cardHolder,
      clientRefId: v4(),
      currency: input.currency,
      fundingSourceId: input.fundingSourceId,
      keyRingId: publicKey.keyRingId,
      ownerProofs: input.ownershipProofs,
    })
    let unsealedCard: VirtualCardUnsealed | undefined
    if (data.card?.length) {
      let cardToUnseal: SealedCard | undefined
      for (const c of data.card) {
        if (await this.deviceKeyWorker.keyExists(c.keyId, KeyType.PrivateKey)) {
          cardToUnseal = c
        }
      }
      if (!cardToUnseal) {
        throw new FatalError(
          'Service did not return a virtual card sealed with the specified key',
        )
      }
      unsealedCard = await this.unsealVirtualCard(cardToUnseal)
    }
    return ProvisionalVirtualCardEntityTransformer.transform({
      ...data,
      card: unsealedCard,
    })
  }

  async updateVirtualCard({
    id,
    expectedCardVersion,
    cardHolder,
    alias,
    billingAddress,
  }: VirtualCardServiceUpdateVirtualCardUseCaseInput): Promise<
    APIResult<VirtualCardEntity, VirtualCardSealedAttributes>
  > {
    const sealedCard = await this.appSync.updateVirtualCard({
      id,
      expectedVersion: expectedCardVersion,
      cardHolder,
      alias,
      billingAddress,
    })
    try {
      const unsealed = await this.unsealVirtualCard(sealedCard)
      return {
        status: APIResultStatus.Success,
        result: VirtualCardEntityTransformer.transformSuccess(unsealed),
      }
    } catch (e) {
      return {
        status: APIResultStatus.Partial,
        result: VirtualCardEntityTransformer.transformFailure(sealedCard),
        cause: e as Error,
      }
    }
  }
  async cancelVirtualCard({
    id,
  }: VirtualCardServiceCancelCardInput): Promise<
    APIResult<VirtualCardEntity, VirtualCardSealedAttributes>
  > {
    const sealedCard = await this.appSync.cancelVirtualCard({
      id,
    })
    try {
      const unsealed = await this.unsealVirtualCard(sealedCard)
      return {
        status: APIResultStatus.Success,
        result: VirtualCardEntityTransformer.transform(unsealed),
      }
    } catch (e) {
      return {
        status: APIResultStatus.Partial,
        result: VirtualCardEntityTransformer.transformFailure(sealedCard),
        cause: e as Error,
      }
    }
  }

  async getVirtualCard({
    id,
    cachePolicy,
  }: CardServiceGetVirtualCardInput): Promise<VirtualCardEntity | undefined> {
    const fetchPolicy = FetchPolicyTransformer.transformCachePolicy(cachePolicy)
    const sealedCard = await this.appSync.getCard({ id }, fetchPolicy)
    if (!sealedCard) {
      return undefined
    }
    const unsealed = await this.unsealVirtualCard(sealedCard)
    return VirtualCardEntityTransformer.transform(unsealed)
  }

  async listVirtualCards(
    input?: CardServiceListVirtualCardsInput,
  ): Promise<
    ListOperationResult<VirtualCardEntity, VirtualCardSealedAttributes>
  > {
    const fetchPolicy = input?.cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(input.cachePolicy)
      : undefined
    const { items: sealedCards, nextToken: newNextToken } =
      await this.appSync.listCards(
        input?.filter,
        input?.limit,
        input?.nextToken,
        fetchPolicy,
      )
    const success: VirtualCardUnsealed[] = []
    const failed: {
      item: Omit<VirtualCardUnsealed, keyof VirtualCardSealedAttributes>
      cause: Error
    }[] = []
    const sealedCardsById = _.groupBy(sealedCards, (s) => s.id)
    for (const sealedCards of Object.values(sealedCardsById)) {
      for (const sealed of sealedCards) {
        try {
          const unsealed = await this.unsealVirtualCard(sealed)
          success.push(unsealed)
          continue
        } catch (e) {
          failed.push({
            item: sealed,
            cause: e as Error,
          })
        }
      }
    }
    if (failed.length) {
      return {
        status: ListOperationResultStatus.Partial,
        nextToken: newNextToken ?? undefined,
        items: success.map(VirtualCardEntityTransformer.transformSuccess),
        failed: failed.map(({ item, cause }) => ({
          item: VirtualCardEntityTransformer.transformFailure(item),
          cause,
        })),
      }
    } else {
      return {
        status: ListOperationResultStatus.Success,
        nextToken: newNextToken ?? undefined,
        items: success.map(VirtualCardEntityTransformer.transformSuccess),
      }
    }
  }
  async getProvisionalCard({
    id,
    cachePolicy,
  }: CardServiceGetProvisionalCardInput): Promise<
    ProvisionalVirtualCardEntity | undefined
  > {
    const fetchPolicy = FetchPolicyTransformer.transformCachePolicy(cachePolicy)
    const data = await this.appSync.getProvisionalCard(id, fetchPolicy)
    if (!data) {
      return undefined
    }
    let unsealedCard: VirtualCardUnsealed | undefined
    if (data.card?.length) {
      let cardToUnseal: SealedCard | undefined
      for (const c of data.card) {
        if (await this.deviceKeyWorker.keyExists(c.keyId, KeyType.PrivateKey)) {
          cardToUnseal = c
        }
      }
      if (!cardToUnseal) {
        throw new FatalError('Failed to unseal card')
      }
      unsealedCard = await this.unsealVirtualCard(cardToUnseal)
    }
    return ProvisionalVirtualCardEntityTransformer.transform({
      ...data,
      card: unsealedCard,
    })
  }
  async listProvisionalCards(
    input?: CardServiceListProvisionalCardsInput,
  ): Promise<ListOperationResult<ProvisionalVirtualCardEntity>> {
    const fetchPolicy = input?.cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(input.cachePolicy)
      : undefined
    const { items, nextToken: newNextToken } =
      await this.appSync.listProvisionalCards(
        input?.filter,
        input?.limit,
        input?.nextToken,
        fetchPolicy,
      )
    const success: ProvisionalCardUnsealed[] = []
    const failed: {
      item: Omit<ProvisionalCard, 'card'>
      cause: Error
    }[] = []
    for (const i of items) {
      let unsealedCard: VirtualCardUnsealed | undefined
      if (i.card?.length) {
        let cardToUnseal: SealedCard | undefined
        for (const sealedCardCopy of i.card) {
          if (
            await this.deviceKeyWorker.keyExists(
              sealedCardCopy.keyId,
              KeyType.PrivateKey,
            )
          ) {
            cardToUnseal = sealedCardCopy
            break
          }
        }
        if (!cardToUnseal) {
          failed.push({ item: i, cause: new KeyNotFoundError() })
          continue
        }
        try {
          unsealedCard = await this.unsealVirtualCard(cardToUnseal)
        } catch (e) {
          failed.push({ item: i, cause: e as Error })
          continue
        }
      }
      success.push({
        ...i,
        card: unsealedCard,
      })
    }
    if (failed.length) {
      return {
        status: ListOperationResultStatus.Partial,
        nextToken: newNextToken ?? undefined,
        items: success.map(
          ProvisionalVirtualCardEntityTransformer.transformSuccess,
        ),
        failed: failed.map(({ item, cause }) => ({
          item: ProvisionalVirtualCardEntityTransformer.transformFailure(item),
          cause,
        })),
      }
    } else {
      return {
        status: ListOperationResultStatus.Success,
        nextToken: newNextToken ?? undefined,
        items: success.map(
          ProvisionalVirtualCardEntityTransformer.transformSuccess,
        ),
      }
    }
  }

  async unsealVirtualCard(card: SealedCard): Promise<VirtualCardUnsealed> {
    let algorithm: EncryptionAlgorithm
    switch (card.algorithm) {
      case 'AES/CBC/PKCS7Padding':
        algorithm = EncryptionAlgorithm.AesCbcPkcs7Padding
        break
      case 'RSAEncryptionOAEPAESCBC':
        algorithm = EncryptionAlgorithm.RsaOaepSha1
        break
      default:
        throw new UnrecognizedAlgorithmError(
          `Encryption Algorithm not supported: ${card.algorithm}`,
        )
    }
    const unseal = async (encrypted: string): Promise<string> => {
      return await this.deviceKeyWorker.unsealString({
        encrypted,
        keyId: card.keyId,
        keyType: KeyType.PrivateKey,
        algorithm,
      })
    }
    const unsealBillingAddress = async (
      input: VirtualCardBillingAddress,
    ): Promise<VirtualCardBillingAddress> => {
      return {
        addressLine1: await unseal(input.addressLine1),
        addressLine2: input.addressLine2
          ? await unseal(input.addressLine2)
          : undefined,
        city: await unseal(input.city),
        state: await unseal(input.state),
        postalCode: await unseal(input.postalCode),
        country: await unseal(input.country),
      }
    }
    const unsealExpiry = async (
      input: VirtualCardExpiry,
    ): Promise<VirtualCardExpiry> => {
      return {
        mm: await unseal(input.mm),
        yyyy: await unseal(input.yyyy),
      }
    }
    return {
      id: card.id,
      owner: card.owner,
      version: card.version,
      createdAtEpochMs: card.createdAtEpochMs,
      updatedAtEpochMs: card.updatedAtEpochMs,
      owners: card.owners,
      fundingSourceId: card.fundingSourceId,
      currency: card.currency,
      state: card.state,
      activeToEpochMs: card.activeToEpochMs,
      cancelledAtEpochMs: card.cancelledAtEpochMs
        ? card.cancelledAtEpochMs
        : undefined,
      last4: card.last4,
      cardHolder: await unseal(card.cardHolder),
      alias: await unseal(card.alias),
      pan: await unseal(card.pan),
      csc: await unseal(card.csc),
      billingAddress: card.billingAddress
        ? await unsealBillingAddress({
            ...card.billingAddress,
            addressLine2: card.billingAddress.addressLine2
              ? card.billingAddress.addressLine2
              : undefined,
          })
        : undefined,
      expiry: await unsealExpiry(card.expiry),
    }
  }

  async getPublicKeyOrRegisterNewKey(): Promise<DeviceKey> {
    let publicKey = await this.deviceKeyWorker.getCurrentPublicKey()
    let registerRequired = false
    if (!publicKey) {
      publicKey = await this.deviceKeyWorker.generateKeyPair()
      registerRequired = true
    } else {
      // Key is found locally but need to check if registered remotely
      let keyFormat: KeyFormat
      switch (publicKey.format) {
        case PublicKeyFormat.SPKI:
          keyFormat = KeyFormat.Spki
          break
        case PublicKeyFormat.RSAPublicKey:
          keyFormat = KeyFormat.RsaPublicKey
          break
      }
      const { items: registeredKeys, nextToken } =
        await this.appSync.getKeyRing({
          keyRingId: publicKey.keyRingId,
          keyFormats: [keyFormat],
        })
      if (registeredKeys.length) {
        const keyIdMatches =
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          registeredKeys.find((key) => key.keyId === publicKey!.id) !==
          undefined
        const keyRingIdMatches =
          registeredKeys.find(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (key) => key.keyRingId === publicKey!.keyRingId,
          ) !== undefined
        if (!keyIdMatches || !keyRingIdMatches) {
          registerRequired = true
        }
      } else if (nextToken) {
      } else {
        registerRequired = true
      }
    }
    if (registerRequired) {
      let keyFormat: KeyFormat
      switch (publicKey.format) {
        case PublicKeyFormat.SPKI:
          keyFormat = KeyFormat.Spki
          break
        case PublicKeyFormat.RSAPublicKey:
          keyFormat = KeyFormat.RsaPublicKey
          break
      }
      await this.appSync.createPublicKey({
        algorithm: publicKey.algorithm,
        keyFormat,
        keyId: publicKey.id,
        keyRingId: publicKey.keyRingId,
        publicKey: publicKey.data,
      })
    }
    return publicKey
  }
}
