import { BankAccountType } from '../../../../public/typings/bankAccountType'

export interface PlaidAccountMetadataEntity {
  accountId: string
  subtype: BankAccountType
}
export interface SandboxPlaidDataEntity {
  accountMetadata: PlaidAccountMetadataEntity[]
  publicToken: string
}
