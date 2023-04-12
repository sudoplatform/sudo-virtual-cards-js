/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DateRangeInput } from '../../../../gen/graphqlTypes'
import { DateRange } from '../../../../public/typings/dateRange'

export class DateRangeTransformer {
  static transformToGraphQLInput(api: DateRange): DateRangeInput {
    return {
      startDateEpochMs: api.startDate.getTime(),
      endDateEpochMs: api.endDate.getTime(),
    }
  }
}
