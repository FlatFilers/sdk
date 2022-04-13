import { FlatfileRecord } from './FlatfileRecord'
import { RecordMutation } from './RecordMutation'

export class RecordError extends RecordMutation {
  constructor(recordOrId: FlatfileRecord | number, errors: { field: string; message: string }[]) {
    super(recordOrId)

    errors.forEach((e) => {
      this.addError(e.field, e.message)
    })
  }
}
