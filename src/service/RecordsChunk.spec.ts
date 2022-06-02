import { Flatfile } from '../Flatfile'
import { ApiService } from '../graphql/ApiService'
import { ImportSession } from '../importer/ImportSession'
import { createChunk, mockGraphQLRequest } from '../lib/test-helper'
import { FlatfileRecord } from './FlatfileRecord'
import { BASE_RECORD } from './FlatfileRecord.spec'
import { RecordsChunk } from './RecordsChunk'

describe('RecordsChunk', function () {
  let session: ImportSession
  let flatfile: Flatfile
  let chunk: RecordsChunk
  let records: FlatfileRecord[]

  beforeEach(async () => {
    records = [1, 2, 3, 4, 5].map((id) => new FlatfileRecord({ ...BASE_RECORD, id }))

    flatfile = new Flatfile('token', {
      apiUrl: 'http://localhost:3000',
      org: { id: 'oId' },
      user: { id: 'uId' },
    })
    flatfile.api = new ApiService('token', 'http://localhost:3000')
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
      mockGraphQLRequest('getFinalDatabaseView', 200, {
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
