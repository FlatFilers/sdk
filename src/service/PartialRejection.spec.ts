import { RequestError } from '../errors/RequestError'
import { Flatfile } from '../Flatfile'
import { ImportSession } from '../importer/ImportSession'
import { mockGraphQLRequest } from '../lib/test-helper'
import { FlatfileRecord } from './FlatfileRecord'
import { BASE_RECORD } from './FlatfileRecord.spec'
import { PartialRejection } from './PartialRejection'
import { RecordError } from './RecordError'

describe('PartialRejection', () => {
  let records: FlatfileRecord[]
  let rejection: PartialRejection
  beforeEach(() => {
    records = [1, 2, 3, 4, 5].map((id) => new FlatfileRecord({ ...BASE_RECORD, id }))
    rejection = new PartialRejection(
      records
        .slice(0, 3)
        .map(
          (record) =>
            new RecordError(record.recordId, [{ field: 'full_name', message: 'test error' }])
        )
    )
  })

  test('can accept a single record failure', () => {
    const record = records[0]
    const err = new RecordError(record.recordId, [{ field: 'full_name', message: 'test error' }])
    rejection = new PartialRejection(err)
    expect(rejection.recordIds).toEqual([1])
  })

  test('can accept many record failures', () => {
    const errs = records
      .slice(0, 3)
      .map(
        (record) =>
          new RecordError(record.recordId, [{ field: 'full_name', message: 'test error' }])
      )
    const rejection = new PartialRejection(errs)
    expect(rejection.recordIds).toEqual([1, 2, 3])
  })

  describe('executeResponse', () => {
    let flatfile: Flatfile
    let session: ImportSession
    beforeEach(async () => {
      flatfile = new Flatfile('asdf', { apiUrl: 'http://localhost:3000' })
      session = new ImportSession(flatfile, {
        batchId: 'abc',
        workspaceId: 'def',
        workbookId: 'hij',
        schemaIds: ['99'],
      })
    })
    test('sends a graphql bulk edit update', async () => {
      mockGraphQLRequest('updateWorkbookRows', 200, { rows: [] })
      await rejection.executeResponse(session)
    })

    test('handles a network failure', async () => {
      mockGraphQLRequest('updateWorkbookRows', 500, { rows: [] })
      await expect(rejection.executeResponse(session)).rejects.toThrow(RequestError)
    })
  })
})
