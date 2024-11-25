/*
 * Copyright © 2024 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { SortOrder as SortOrderGraphQL } from '../../../../gen/graphqlTypes'
import { SortOrder as SortOrderEntity } from '../../../../public/typings/sortOrder'

export class SortOrderTransformer {
  static transformToGraphQL(data: SortOrderEntity): SortOrderGraphQL {
    switch (data) {
      case SortOrderEntity.Asc:
        return SortOrderGraphQL.Asc
      case SortOrderEntity.Desc:
        return SortOrderGraphQL.Desc
    }
  }
}
