/*
 * Copyright © 2024 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CardFilterInput as FilterGraphQL } from '../../../../gen/graphqlTypes'
import { VirtualCardFilterInput as FilterEntity } from '../../../../public/typings/virtualCard'

export class VirtualCardFilterTransformer {
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
        VirtualCardFilterTransformer.transformToGraphQL(filter),
      )
    }
    if (data.or) {
      filterGraphQL.or = data.or?.map((filter) =>
        VirtualCardFilterTransformer.transformToGraphQL(filter),
      )
    }
    if (data.not) {
      filterGraphQL.not = VirtualCardFilterTransformer.transformToGraphQL(
        data.not,
      )
    }
    return filterGraphQL
  }
}
