/*
 * Copyright © 2024 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { FundingSourceFilterInput as FilterGraphQL } from '../../../../gen/graphqlTypes'
import { FundingSourceFilterInput as FilterEntity } from '../../../../public/typings/fundingSource'

export class FundingSourceFilterTransformer {
  static transformToGraphQL(data: FilterEntity): FilterGraphQL {
    const filterGraphQL: FilterGraphQL = {}
    if (data.id) {
      filterGraphQL.id = data.id
    }
    if (data.state) {
      filterGraphQL.state = data.state
    }
    if (data.and) {
      filterGraphQL.and = data.and?.map((filter) =>
        FundingSourceFilterTransformer.transformToGraphQL(filter),
      )
    }
    if (data.or) {
      filterGraphQL.or = data.or?.map((filter) =>
        FundingSourceFilterTransformer.transformToGraphQL(filter),
      )
    }
    if (data.not) {
      filterGraphQL.not = FundingSourceFilterTransformer.transformToGraphQL(
        data.not,
      )
    }
    return filterGraphQL
  }
}
