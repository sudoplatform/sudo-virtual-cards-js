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
