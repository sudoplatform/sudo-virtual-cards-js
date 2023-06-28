import { SandboxGetPlaidDataResponse } from '../../../../gen/graphqlTypes'
import { BankAccountType } from '../../../../public/typings/bankAccountType'
import { SandboxPlaidDataEntity } from '../../../domain/entities/fundingSource/sandboxPlaidDataEntity'

function bankAccountTypeFromPlaidSubtype(
  subtype?: string | null,
): BankAccountType {
  switch (subtype) {
    case 'checking':
      return BankAccountType.Checking
    case 'savings':
      return BankAccountType.Savings
    default:
      return BankAccountType.Other
  }
}

export class SandboxPlaidDataEntityTransformer {
  static transformGraphQL(
    data: SandboxGetPlaidDataResponse,
  ): SandboxPlaidDataEntity {
    return {
      accountMetadata: data.accountMetadata.map((a) => ({
        accountId: a.accountId,
        subtype: bankAccountTypeFromPlaidSubtype(a.subtype),
      })),
      publicToken: data.publicToken,
    }
  }
}
