import {
  EncryptionAlgorithm,
  UnrecognizedAlgorithmError,
} from '@sudoplatform/sudo-common'
import {
  anything,
  capture,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when,
} from 'ts-mockito'
import { DeviceKeyWorker } from '../../../../../src/private/data/common/deviceKeyWorker'
import {
  DefaultTransactionWorker,
  TransactionUnsealed,
} from '../../../../../src/private/data/common/transactionWorker'
import { DeclineReason } from '../../../../../src/public/typings/transaction'
import { GraphQLDataFactory } from '../../../data-factory/graphQl'
import { ServiceDataFactory } from '../../../data-factory/service'

describe('DefaultTransactionWorker test suite', () => {
  const mockDeviceKeyWorker = mock<DeviceKeyWorker>()
  let iut: DefaultTransactionWorker

  beforeEach(() => {
    reset(mockDeviceKeyWorker)

    iut = new DefaultTransactionWorker(instance(mockDeviceKeyWorker))

    when(mockDeviceKeyWorker.getCurrentPublicKey()).thenResolve(
      ServiceDataFactory.deviceKey,
    )
    when(mockDeviceKeyWorker.unsealString(anything())).thenResolve(
      'UNSEALED-STRING',
    )
    // Required as decline reason needs to match a true decline reason
    when(
      mockDeviceKeyWorker.unsealString(
        objectContaining({
          encrypted: GraphQLDataFactory.sealedTransaction.declineReason,
        }),
      ),
    ).thenResolve(DeclineReason.Declined)
    when(
      mockDeviceKeyWorker.unsealString(
        objectContaining({
          encrypted: 'SEALED-NUMBER',
        }),
      ),
    ).thenResolve('100')
  })

  it('should throw UnrecognizedAlgorithmError if algorithm is not recognized', async () => {
    await expect(
      iut.unsealTransaction({
        ...GraphQLDataFactory.sealedTransaction,
        algorithm: 'something',
      }),
    ).rejects.toEqual(
      new UnrecognizedAlgorithmError(
        'Asymmetric encryption algorithm not supported: something',
      ),
    )
    verify(mockDeviceKeyWorker.unsealString(anything())).never()
  })

  it.each`
    algorithm                    | expected
    ${'RSAEncryptionOAEPAESCBC'} | ${EncryptionAlgorithm.RsaOaepSha1}
  `(
    'should return expected result with $algorithm',
    async ({ algorithm, expected }) => {
      const unsealedAmount = {
        currency: 'UNSEALED-STRING',
        amount: 100,
      }

      await expect(
        iut.unsealTransaction({
          ...GraphQLDataFactory.sealedTransaction,
          algorithm,
        }),
      ).resolves.toEqual<TransactionUnsealed>({
        ...ServiceDataFactory.transactionUnsealed,
        billedAmount: unsealedAmount,
        transactedAmount: unsealedAmount,
        description: 'UNSEALED-STRING',
        declineReason: DeclineReason.Declined,
        detail: [
          ...(ServiceDataFactory.transactionUnsealed.detail?.map((d) => ({
            ...d,
            description: 'UNSEALED-STRING',
            fundingSourceAmount: unsealedAmount,
            markup: {
              flat: 100,
              minCharge: 100,
              percent: 100,
            },
            markupAmount: unsealedAmount,
            virtualCardAmount: unsealedAmount,
          })) ?? []),
        ],
      })

      verify(mockDeviceKeyWorker.unsealString(anything())).atLeast(1)
      const [actualArg] = capture(mockDeviceKeyWorker.unsealString).first()
      expect(actualArg).toMatchObject({
        keyId: GraphQLDataFactory.sealedTransaction.keyId,
        algorithm: expected,
      })
    },
  )
})
