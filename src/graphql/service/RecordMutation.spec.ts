import { ELevel, FlatfileRecord } from './FlatfileRecord'
import { BASE_RECORD } from './FlatfileRecord.spec'
import { RecordMutation } from './RecordMutation'

describe('RecordMutation', () => {
  let record: FlatfileRecord
  let mutation: RecordMutation
  beforeEach(() => {
    record = new FlatfileRecord(BASE_RECORD)
    mutation = record.getMutation()
  })

  test('can initialize properly with just an ID', () => {
    mutation = new RecordMutation(record.recordId)
    expect(mutation.recordId).toBe(9)
  })

  test('can initialize properly with a record object', () => {
    mutation = new RecordMutation(record)
    expect(mutation.recordId).toBe(9)
  })

  test('calling set for a field stages the edits properly', () => {
    mutation.set('full_name', 'David Smith')
    expect(mutation.toGraphQLEdits().data).toEqual({ full_name: 'David Smith' })
  })

  test('calling addInfo for a field stages an info level message', () => {
    mutation.addInfo('full_name', 'Nice name bro')
    expect(mutation.toGraphQLEdits().messages.find((m) => m.error === 'info')?.message).toEqual(
      'Nice name bro'
    )
  })

  test('calling addError for a field stages an error level message', () => {
    mutation.addError('full_name', 'Get that name changed')
    expect(mutation.toGraphQLEdits().messages.find((m) => m.error === 'error')?.message).toEqual(
      'Get that name changed'
    )
  })

  test('calling addWarning for a field stages an warning level message', () => {
    mutation.addWarning('full_name', 'How do you pronounce that?')
    expect(mutation.toGraphQLEdits().messages.find((m) => m.error === 'warn')?.message).toEqual(
      'How do you pronounce that?'
    )
  })

  test('calling pushMessage with an array of fields creates a message for each', () => {
    mutation.addMessage(
      ['full_name', 'email'],
      'Looks like you are using someone elses email.',
      ELevel.WARN
    )
    expect(mutation.toGraphQLEdits().messages.length).toBe(2)
  })
})
