import { ApiService } from '../graphql/ApiService'
import { ImportSession } from '../importer/ImportSession'
import { PartialRejection } from '../service/PartialRejection'
import { RecordError } from '../service/RecordError'
import { RecordsChunk } from '../service/RecordsChunk'
import { IteratorCallback, RecordChunkIterator } from './RecordChunkIterator'
import { createChunk, makeRecords, mockGraphQLRequest } from './test-helper'

jest.mock('../graphql/ApiService')

describe('RecordChunkIterator', () => {
  let api: ApiService
  let session: ImportSession
  let iterator: RecordChunkIterator
  let chunk: RecordsChunk
  let chunk2: RecordsChunk
  let callbackFn: IteratorCallback

  beforeEach(async () => {
    api = new ApiService('token', 'http://localhost:3000')
    session = new ImportSession(api, {
      batchId: 'abc',
      workspaceId: 'def',
      workbookId: 'hij',
      schemaIds: ['99'],
    })
    chunk = createChunk(session, makeRecords(0, 10), 20, 0, 10)
    chunk2 = createChunk(session, makeRecords(10, 10), 20, 10, 10)
    callbackFn = jest.fn((chunk, next) => next())
    jest.spyOn(api, 'getRecordsByStatus').mockResolvedValue(chunk)
    jest.spyOn(chunk, 'getNextChunk').mockResolvedValue(chunk2)

    iterator = new RecordChunkIterator(session, (chunk, next) => callbackFn(chunk, next), {
      chunkSize: 10,
    })

    mockGraphQLRequest('getFinalDatabaseView', 200, {
      rows: [],
      totalRows: 100,
    })
  })

  afterEach(() => jest.restoreAllMocks())

  describe('beforeFirst()', () => {
    test('is called once at the beginning', async () => {
      const spy = jest.spyOn(iterator, 'beforeFirst')
      await iterator.process()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(callbackFn).toHaveBeenNthCalledWith(1, chunk, expect.any(Function))
    })

    test('provides a value that is passed to beforeOthers', async () => {
      const spy = jest.spyOn(iterator, 'beforeOthers')
      await iterator.process()
      expect(spy).toHaveBeenCalledWith(chunk)
    })
  })

  describe('beforeOthers(chunk)', () => {
    test('is called once per chunk except the first + once at the end', async () => {
      const spy = jest.spyOn(iterator, 'beforeOthers')
      await iterator.process()
      expect(spy).toHaveBeenCalledTimes(2)
    })

    test('gets the next chunk data', async () => {
      const spy = jest.spyOn(chunk, 'getNextChunk')
      const spy2 = jest.spyOn(chunk2, 'getNextChunk')
      await iterator.process()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy2).toHaveBeenCalledTimes(1)
    })
  })

  describe('afterEach()', () => {
    test('is called once per chunk', async () => {
      const spy = jest.spyOn(iterator, 'afterEach')
      await iterator.process()
      expect(spy).toHaveBeenCalledTimes(2)
    })

    test('can interrupt the process with an error', async () => {
      const err = new Error('test error')
      callbackFn = jest.fn((chunk, next) => next(err))
      const spy = jest.spyOn(iterator, 'afterEach')
      await expect(iterator.process()).rejects.toThrow(err)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    test('appends relevant ids to the iterator', async () => {
      await iterator.process()
      expect(iterator.acceptedIds).toHaveLength(20)
    })

    test('processes the PartialRejection', async () => {
      const recordErrors = makeRecords(0, 5).map((r) => new RecordError(r, []))
      const rejection = new PartialRejection(recordErrors)
      jest.spyOn(rejection, 'executeResponse').mockResolvedValue(rejection)
      callbackFn = jest.fn((chunk, next) => {
        next(rejection)
      })
      await iterator.process()
      expect(iterator.acceptedIds).toHaveLength(15)
    })
  })

  describe('next(chunk, err)', () => {
    test('is called once per chunk', async () => {
      const spy = jest.spyOn(iterator, 'next')
      await iterator.process()
      expect(spy).toHaveBeenCalledTimes(2)
    })

    test('completes with afterAll when no new chunk', async () => {
      jest.spyOn(iterator, 'beforeOthers').mockResolvedValue(null)
      const spy = jest.spyOn(iterator, 'afterAll')
      const spy2 = jest.spyOn(iterator, 'next')
      await iterator.process()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy2).toHaveBeenCalledTimes(1)
    })
  })

  describe('process()', () => {
    test('returns a resolved promise after last chunk', async () => {
      await expect(iterator.process()).resolves.toBe(undefined)
    })
    test('returns a rejected promise on failure and stops iterating', async () => {
      const err = new Error('test error')
      jest.spyOn(iterator, 'afterEach').mockRejectedValue(err)
      await expect(iterator.process()).rejects.toThrow(err)
    })
  })

  describe('afterAll()', () => {
    test('is called once at the end', async () => {
      const spy = jest.spyOn(iterator, 'afterAll')
      await iterator.process()
      expect(spy).toHaveBeenCalledTimes(1)
    })
    test('calls emit event and completes', async () => {
      const spy = jest.spyOn(iterator, 'emit')
      await iterator.process()
      expect(spy).toHaveBeenCalledTimes(1)
    })
    test('updates record status for processed records', async () => {
      const spy = jest.spyOn(iterator.api, 'updateRecordStatus')
      await iterator.process()
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })
})
