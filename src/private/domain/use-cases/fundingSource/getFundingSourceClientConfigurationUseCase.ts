/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { FundingSourceService } from '../../entities/fundingSource/fundingSourceService'

export class GetFundingSourceClientConfigurationUseCase {
  constructor(private readonly fundingSourceService: FundingSourceService) {}

  async execute(): Promise<string> {
    return await this.fundingSourceService.getFundingSourceClientConfiguration()
  }
}
