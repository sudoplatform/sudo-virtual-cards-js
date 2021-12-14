import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'

export class GetFundingSourceClientConfigurationUseCase {
  constructor(private readonly fundingSourceService: FundingSourceService) {}

  async execute(): Promise<string> {
    return await this.fundingSourceService.getFundingSourceClientConfiguration()
  }
}
