/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { FatalError } from '@sudoplatform/sudo-common'
import {
  SealedCurrencyAmountAttribute,
  SealedTransaction,
  SealedTransactionDetailChargeAttribute,
} from '../../../gen/graphqlTypes'
import {
  ChargeDetailState,
  DeclineReason,
  TransactionType,
} from '../../../public/typings/transaction'
import {
  CurrencyAmountEntity,
  MarkupEntity,
  TransactionDetailChargeEntity,
} from '../../domain/entities/transaction/transactionEntity'
import { DeviceKeyWorker, KeyType } from './deviceKeyWorker'
import { AlgorithmTransformer } from './transformer/algorithmTransformer'

export interface TransactionUnsealed {
  id: string
  owner: string
  version: number
  createdAtEpochMs: number
  updatedAtEpochMs: number
  sortDateEpochMs: number
  cardId: string
  sequenceId: string
  type: TransactionType
  billedAmount: CurrencyAmountEntity
  transactedAmount: CurrencyAmountEntity
  description: string
  transactedAtEpochMs: number
  settledAtEpochMs?: number
  declineReason?: DeclineReason
  detail?: {
    virtualCardAmount: CurrencyAmountEntity
    markup: MarkupEntity
    markupAmount: CurrencyAmountEntity
    fundingSourceAmount: CurrencyAmountEntity
    transactedAt?: Date
    settledAt?: Date
    fundingSourceId: string
    description: string
    state: ChargeDetailState
    continuationOfExistingCharge: boolean
  }[]
}

export interface TransactionWorker {
  unsealTransaction(
    sealedTransaction: SealedTransaction,
  ): Promise<TransactionUnsealed>
}

export class DefaultTransactionWorker implements TransactionWorker {
  public constructor(private readonly deviceKeyWorker: DeviceKeyWorker) {}

  async unsealTransaction(
    transaction: SealedTransaction,
  ): Promise<TransactionUnsealed> {
    const algorithm = AlgorithmTransformer.toEncryptionAlgorithm(
      KeyType.PrivateKey,
      transaction.algorithm,
    )
    const unseal = async (encrypted: string): Promise<string> => {
      return await this.deviceKeyWorker.unsealString({
        encrypted,
        keyId: transaction.keyId,
        keyType: KeyType.PrivateKey,
        algorithm,
      })
    }
    const unsealNumber = async (
      encrypted: string,
      name?: string,
    ): Promise<number> => {
      const unsealed = await unseal(encrypted)
      const numUnsealed = parseInt(unsealed)
      if (Number.isNaN(numUnsealed)) {
        throw new FatalError(
          `Invalid data when unsealing an expected number - property: ${
            name ?? 'unknown'
          }`,
        )
      }
      return numUnsealed
    }
    const unsealCurrencyAmount = async (
      encrypted: SealedCurrencyAmountAttribute,
    ): Promise<CurrencyAmountEntity> => {
      return {
        currency: await unseal(encrypted.currency),
        amount: await unsealNumber(encrypted.amount, 'amount'),
      }
    }
    const unsealDeclineReason = async (
      encrypted: string,
    ): Promise<DeclineReason> => {
      const unsealed = await unseal(encrypted)
      for (const val of Object.values(DeclineReason)) {
        if (unsealed === (val as string)) {
          return val
        }
      }
      throw new FatalError(`Unsupported Decline Reason: ${unsealed}`)
    }
    const unsealChargeDetailState = async (
      encrypted: string,
    ): Promise<ChargeDetailState> => {
      const unsealed = await unseal(encrypted)
      for (const val of Object.values(ChargeDetailState)) {
        if (unsealed === (val as string)) {
          return val
        }
      }
      throw new FatalError(`Unsupported Charge Detail State: ${unsealed}`)
    }
    const unsealDetail = async (
      encrypted: SealedTransactionDetailChargeAttribute,
    ): Promise<TransactionDetailChargeEntity> => {
      const [
        virtualCardAmount,
        markupPercent,
        markupFlat,
        markupMinCharge,
        markupAmount,
        fundingSourceAmount,
        transactedAtEpochMs,
        settledAtEpochMs,
        description,
        state,
      ] = await Promise.all([
        unsealCurrencyAmount(encrypted.virtualCardAmount),
        unsealNumber(encrypted.markup.percent, 'markup.percent'),
        unsealNumber(encrypted.markup.flat, 'markup.flat'),
        encrypted.markup.minCharge
          ? unsealNumber(encrypted.markup.minCharge, 'markup.minCharge')
          : Promise.resolve(undefined),
        unsealCurrencyAmount(encrypted.markupAmount),
        unsealCurrencyAmount(encrypted.fundingSourceAmount),
        encrypted.transactedAtEpochMs
          ? unsealNumber(
              encrypted.transactedAtEpochMs,
              'detail.transactedAtEpochMs',
            )
          : Promise.resolve(undefined),
        encrypted.settledAtEpochMs
          ? unsealNumber(encrypted.settledAtEpochMs, 'detail.settledAtEpochMs')
          : Promise.resolve(undefined),
        unseal(encrypted.description),
        encrypted.state
          ? unsealChargeDetailState(encrypted.state)
          : Promise.resolve(ChargeDetailState.Cleared),
      ])

      return {
        virtualCardAmount: virtualCardAmount,
        markup: {
          percent: markupPercent,
          flat: markupFlat,
          minCharge: markupMinCharge,
        },
        markupAmount,
        fundingSourceAmount,
        transactedAt: transactedAtEpochMs
          ? new Date(transactedAtEpochMs)
          : undefined,
        settledAt: settledAtEpochMs ? new Date(settledAtEpochMs) : undefined,
        fundingSourceId: encrypted.fundingSourceId,
        description,
        state,
        continuationOfExistingCharge: !!encrypted.continuationOfExistingCharge,
      }
    }

    let transactionDetail: TransactionDetailChargeEntity[] | undefined
    if (transaction.detail) {
      transactionDetail = await Promise.all(
        transaction.detail.map(async (d) => {
          return await unsealDetail(d)
        }),
      )
    }
    const [
      billedAmount,
      transactedAmount,
      description,
      transactedAtEpochMs,
      settledAtEpochMs,
      declineReason,
    ] = await Promise.all([
      unsealCurrencyAmount(transaction.billedAmount),
      unsealCurrencyAmount(transaction.transactedAmount),
      unseal(transaction.description),
      unsealNumber(transaction.transactedAtEpochMs, 'transactedAtEpochMs'),
      transaction.settledAtEpochMs
        ? unsealNumber(transaction.settledAtEpochMs, 'settledAtEpochMs')
        : Promise.resolve(undefined),
      transaction.declineReason
        ? unsealDeclineReason(transaction.declineReason)
        : Promise.resolve(undefined),
    ])
    return {
      id: transaction.id,
      owner: transaction.owner,
      version: transaction.version,
      createdAtEpochMs: transaction.createdAtEpochMs,
      updatedAtEpochMs: transaction.updatedAtEpochMs,
      sortDateEpochMs: transaction.sortDateEpochMs,
      cardId: transaction.cardId,
      sequenceId: transaction.sequenceId,
      type: transaction.type,
      billedAmount,
      transactedAmount,
      description,
      transactedAtEpochMs,
      settledAtEpochMs,
      declineReason,
      detail: transactionDetail,
    }
  }
}
