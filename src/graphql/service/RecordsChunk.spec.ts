import { Flatfile } from '../../Flatfile'
import { ImportSession } from '../../importer/ImportSession'
import { mockOneGraphQLRequest } from '../../utils/test-helper'
import { ERecordStatus, FlatfileRecord } from './FlatfileRecord'
import { BASE_RECORD } from './FlatfileRecord.spec'
import { RecordsChunk } from './RecordsChunk'

describe('RecordsChunk', function () {
  let flatfile: Flatfile
  let session: ImportSession
  let chunk: RecordsChunk
  let records: FlatfileRecord[]

  beforeEach(async () => {
    records = [1, 2, 3, 4, 5].map((id) => new FlatfileRecord({ ...BASE_RECORD, id }))

    flatfile = new Flatfile('asdf', { apiUrl: 'http://localhost:3000' })
    session = new ImportSession(flatfile, {
      batchId: 'abc',
      workspaceId: 'def',
      workbookId: 'hij',
      schemaIds: ['99'],
    })

    chunk = createChunk(session, records, 100)
  })
  test('recordIds returns list of ids in chunk', () => {
    expect(chunk.recordIds).toEqual([1, 2, 3, 4, 5])
  })

  describe('getNextChunk', () => {
    test('increments properly', async () => {
      mockOneGraphQLRequest('getFinalDatabaseView', 200, {
        rows: [],
        totalRows: 100,
      })

      const nextChunk = await chunk.getNextChunk()
      expect(nextChunk?.currentChunkIndex).toEqual(1)
      const nullChunk = await nextChunk?.getNextChunk()
      expect(nullChunk).toEqual(null)
    })
  })

  describe('currentChunkIndex', () => {
    test('is 0 based', () => {
      expect(chunk.currentChunkIndex).toEqual(0)
    })
    test('increments in chunks of of proper length', () => {
      chunk = createChunk(session, records, 100, 60)
      expect(chunk.currentChunkIndex).toEqual(1)
    })
  })

  describe('totalChunks', () => {
    test('is calculated correctly', () => {
      expect(chunk.totalChunks).toEqual(2)
    })
    test('is at least one', () => {
      chunk = createChunk(session, records, 30)
      expect(chunk.totalChunks).toEqual(1)
    })
    test('includes a chunk for partials', () => {
      chunk = createChunk(session, records, 120)
      expect(chunk.totalChunks).toEqual(3)
    })
  })
})

function createChunk(
  session: ImportSession,
  records: FlatfileRecord[],
  totalRecords = 100,
  skip = 0
) {
  return new RecordsChunk(session, records, {
    status: ERecordStatus.REVIEW,
    skip,
    totalRecords,
    limit: 50,
  })
}
