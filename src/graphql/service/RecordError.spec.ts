import { FlatfileRecord } from './FlatfileRecord'
import { BASE_RECORD } from './FlatfileRecord.spec'
import { RecordError } from './RecordError'

describe('RecordError', () => {
  let record: FlatfileRecord
  let err: RecordError

  beforeEach(() => {
    record = new FlatfileRecord(BASE_RECORD)
    err = new RecordError(record, [{ field: 'full_name', message: 'test error' }])
  })

  test('can initialize properly with just an ID', () => {
    err = new RecordError(record.recordId, [{ field: 'full_name', message: 'test error' }])
    expect(err.recordId).toBe(9)
  })

  test('can initialize properly with a record object', () => {
    expect(err.recordId).toBe(9)
  })

  test('errors passed in the initialization are staged as errors', () => {
    err.addInfo('full_name', 'Nice name bro')
    expect(err.toGraphQLEdits().messages.find((m) => m.error === 'error')?.message).toEqual(
      'test error'
    )
  })

  test('you can call addInfo and other mutation methods as well', () => {
    err.addInfo('full_name', 'Nice name bro')
    expect(err.toGraphQLEdits().messages.find((m) => m.error === 'info')?.message).toEqual(
      'Nice name bro'
    )
  })
})
