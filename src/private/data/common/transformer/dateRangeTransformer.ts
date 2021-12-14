import { DateRange } from '../../../..'
import { DateRangeInput } from '../../../../gen/graphqlTypes'

export class DateRangeTransformer {
  static transformToGraphQLInput(api: DateRange): DateRangeInput {
    return {
      startDateEpochMs: api.startDate.getTime(),
      endDateEpochMs: api.endDate.getTime(),
    }
  }
}
