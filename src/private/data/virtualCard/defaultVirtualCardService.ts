import {
  DecodeError,
  DefaultLogger,
  EncryptionAlgorithm,
  FatalError,
  KeyNotFoundError,
  ListOperationResult,
  ListOperationResultStatus,
  Logger,
  PublicKeyFormat,
  UnrecognizedAlgorithmError,
} from '@sudoplatform/sudo-common'
import _ from 'lodash'
import { v4 } from 'uuid'
import {
  KeyFormat,
  ProvisionalCard,
  SealedAttribute,
  SealedCard,
} from '../../../gen/graphqlTypes'
import { APIResult, APIResultStatus } from '../../../public/typings/apiResult'
import { Metadata } from '../../../public/typings/metadata'
import { CardState } from '../../../public/typings/virtualCard'
import { TransactionEntity } from '../../domain/entities/transaction/transactionEntity'
import { ProvisionalVirtualCardEntity } from '../../domain/entities/virtualCard/provisionalVirtualCardEntity'
import { VirtualCardEntity } from '../../domain/entities/virtualCard/virtualCardEntity'
import {
  VirtualCardService,
  VirtualCardServiceCancelCardInput,
  VirtualCardServiceGetProvisionalCardInput,
  VirtualCardServiceGetVirtualCardInput,
  VirtualCardServiceListProvisionalCardsInput,
  VirtualCardServiceListVirtualCardsInput,
  VirtualCardServiceProvisionVirtualCardInput,
  VirtualCardServiceUpdateVirtualCardUseCaseInput,
} from '../../domain/entities/virtualCard/virtualCardService'
import { ApiClient } from '../common/apiClient'
import { DeviceKey, DeviceKeyWorker, KeyType } from '../common/deviceKeyWorker'
import {
  TransactionUnsealed,
  TransactionWorker,
} from '../common/transactionWorker'
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
  alias?: string
  pan: string
  csc: string
  billingAddress?: VirtualCardBillingAddress
  expiry: VirtualCardExpiry
  lastTransaction?: TransactionUnsealed
  metadata?: Metadata
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
  lastTransaction?: TransactionEntity
  metadata?: Metadata
}

export class DefaultVirtualCardService implements VirtualCardService {
  private readonly log: Logger

  constructor(
    private readonly appSync: ApiClient,
    private readonly deviceKeyWorker: DeviceKeyWorker,
    private readonly transactionWorker: TransactionWorker,
  ) {
    this.log = new DefaultLogger(this.constructor.name)
  }

  async provisionVirtualCard(
    input: VirtualCardServiceProvisionVirtualCardInput,
  ): Promise<ProvisionalVirtualCardEntity> {
    const publicKey = await this.getPublicKeyOrRegisterNewKey()
    const sealedMetadata = await this.sealMetadata(input.metadata)

    const data = await this.appSync.provisionVirtualCard({
      alias: input.alias,
      billingAddress: input.billingAddress,
      cardHolder: input.cardHolder,
      metadata: sealedMetadata,
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
    metadata,
  }: VirtualCardServiceUpdateVirtualCardUseCaseInput): Promise<
    APIResult<VirtualCardEntity, VirtualCardSealedAttributes>
  > {
    const sealedMetadata = await this.sealMetadata(metadata)
    const sealedCard = await this.appSync.updateVirtualCard({
      id,
      expectedVersion: expectedCardVersion,
      cardHolder,
      alias,
      billingAddress,
      metadata: sealedMetadata,
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
  }: VirtualCardServiceGetVirtualCardInput): Promise<
    VirtualCardEntity | undefined
  > {
    const fetchPolicy = cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(cachePolicy)
      : undefined
    const sealedCard = await this.appSync.getCard({ id }, fetchPolicy)
    if (!sealedCard) {
      return undefined
    }
    const unsealed = await this.unsealVirtualCard(sealedCard)
    return VirtualCardEntityTransformer.transform(unsealed)
  }

  async listVirtualCards(
    input?: VirtualCardServiceListVirtualCardsInput,
  ): Promise<
    ListOperationResult<VirtualCardEntity, VirtualCardSealedAttributes>
  > {
    const fetchPolicy = input?.cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(input.cachePolicy)
      : undefined
    const { items: sealedCards, nextToken: newNextToken } =
      await this.appSync.listCards(input?.limit, input?.nextToken, fetchPolicy)
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
  }: VirtualCardServiceGetProvisionalCardInput): Promise<
    ProvisionalVirtualCardEntity | undefined
  > {
    const fetchPolicy = cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(cachePolicy)
      : undefined
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
    input?: VirtualCardServiceListProvisionalCardsInput,
  ): Promise<ListOperationResult<ProvisionalVirtualCardEntity>> {
    const fetchPolicy = input?.cachePolicy
      ? FetchPolicyTransformer.transformCachePolicy(input.cachePolicy)
      : undefined
    const { items, nextToken: newNextToken } =
      await this.appSync.listProvisionalCards(
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
      alias: card.alias ? await unseal(card.alias) : undefined,
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
      lastTransaction: card.lastTransaction
        ? await this.transactionWorker.unsealTransaction(card.lastTransaction)
        : undefined,
      metadata: await this.unsealMetadata(card.metadata),
    }
  }

  /**
   * @deprecated
   *   Replaced with pre-requisite to have called {@link createKeysIfAbsent} but
   *   left in place and called for now for backwards compatibility.
   */
  async getPublicKeyOrRegisterNewKey(): Promise<DeviceKey> {
    let publicKey = await this.deviceKeyWorker.getCurrentPublicKey()
    let registerRequired = false
    if (!publicKey) {
      publicKey = await this.deviceKeyWorker.generateKeyPair()
      registerRequired = true
    } else {
      let keyFormat: KeyFormat
      switch (publicKey.format) {
        case PublicKeyFormat.SPKI:
          keyFormat = KeyFormat.Spki
          break
        case PublicKeyFormat.RSAPublicKey:
          keyFormat = KeyFormat.RsaPublicKey
          break
      }
      // Key is found locally but need to check if registered remotely
      const fetchedPublicKey = await this.appSync.getPublicKey(publicKey.id, [
        keyFormat,
      ])
      if (!fetchedPublicKey) {
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

  private async sealMetadata(
    metadata?: Metadata | null,
  ): Promise<SealedAttribute | undefined | null> {
    if (metadata === undefined || metadata === null) {
      return metadata
    }

    const secretKeyId =
      (await this.deviceKeyWorker.getCurrentSymmetricKeyId()) ??
      (await this.deviceKeyWorker.generateCurrentSymmetricKey())

    const serialisedMetadata = JSON.stringify(metadata)
    const sealedMetadata = await this.deviceKeyWorker.sealString({
      string: serialisedMetadata,
      keyId: secretKeyId,
      keyType: KeyType.SymmetricKey,
      algorithm: EncryptionAlgorithm.AesCbcPkcs7Padding,
    })

    return {
      keyId: secretKeyId,
      algorithm: EncryptionAlgorithm.AesCbcPkcs7Padding,
      plainTextType: 'json-string',
      base64EncodedSealedData: sealedMetadata,
    }
  }

  private async unsealMetadata(
    metadata?: SealedAttribute | null,
  ): Promise<Metadata | undefined> {
    if (metadata === undefined || metadata === null) {
      return undefined
    }

    let algorithm: EncryptionAlgorithm
    switch (metadata.algorithm) {
      case 'AES/CBC/PKCS7Padding':
        algorithm = EncryptionAlgorithm.AesCbcPkcs7Padding
        break
      default:
        throw new UnrecognizedAlgorithmError(metadata.algorithm)
    }

    const unsealedMetadata = await this.deviceKeyWorker.unsealString({
      encrypted: metadata.base64EncodedSealedData,
      keyId: metadata.keyId,
      keyType: KeyType.SymmetricKey,
      algorithm,
    })

    try {
      const parsed = JSON.parse(unsealedMetadata) as Metadata
      return parsed
    } catch (err) {
      const message = 'Unable to parse unsealed metadata as JSON'
      this.log.error(message, {
        err,
        unsealedMetadata,
      })
      throw new DecodeError(message)
    }
  }
}
