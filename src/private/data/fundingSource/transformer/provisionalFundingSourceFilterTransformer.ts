/*
 * Copyright © 2024 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProvisionalFundingSourceFilterInput as FilterGraphQL } from '../../../../gen/graphqlTypes'
import { ProvisionalFundingSourceFilterInput as FilterEntity } from '../../../../public/typings/fundingSource'

export class ProvisionalFundingSourceFilterTransformer {
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
        ProvisionalFundingSourceFilterTransformer.transformToGraphQL(filter),
      )
    }
    if (data.or) {
      filterGraphQL.or = data.or?.map((filter) =>
        ProvisionalFundingSourceFilterTransformer.transformToGraphQL(filter),
      )
    }
    if (data.not) {
      filterGraphQL.not =
        ProvisionalFundingSourceFilterTransformer.transformToGraphQL(data.not)
    }
    return filterGraphQL
  }
}
