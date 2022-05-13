import { Flatfile } from '../Flatfile'
import { ApiService } from '../graphql/ApiService'
import { IteratorCallback, RecordChunkIterator } from '../lib/RecordChunkIterator'
import { createChunk, makeRecords } from '../lib/test-helper'
import { RecordsChunk } from '../service/RecordsChunk'
import { ImportFrame } from './ImportFrame'
import { ImportSession } from './ImportSession'

jest.mock('../graphql/ApiService')

describe('ImportSession', () => {
  let session: ImportSession
  let chunk: RecordsChunk
  let callbackFn: IteratorCallback
  let flatfile: Flatfile

  beforeEach(async () => {
    flatfile = new Flatfile('token', { apiUrl: 'http://localhost:3000' })
    flatfile.api = new ApiService('toke', 'http://localhost:3000')
    session = new ImportSession(flatfile, {
      mountUrl: 'url',
      batchId: 'abc',
      workspaceId: 'def',
      workbookId: 'hij',
      schemaIds: ['99'],
    })

    chunk = createChunk(session, makeRecords(0, 10), 10, 0, 10)
    callbackFn = jest.fn((chunk, next) => next())
    jest.spyOn(flatfile.api, 'getRecordsByStatus').mockResolvedValue(chunk)
    Object.defineProperty(flatfile.api, 'token', { get: () => 'token' })
  })

  test('openInEmbeddedIframe', async () => {
    expect(document.body.classList).not.toContain('flatfile-active')
    await session.openInEmbeddedIframe()
    expect(document.body.classList).toContain('flatfile-active')
  })

  describe('iframe', () => {
    test('is created on demand', async () => {
      expect(session.iframe).toBeInstanceOf(ImportFrame)
    })

    test('is re-used on 2nd invocation', async () => {
      const firstFrame = session.iframe
      expect(firstFrame).toBeInstanceOf(ImportFrame)
      expect(session.iframe).toBe(firstFrame)
    })
  })

  test('signedImportUrl', async () => {
    expect(session.signedImportUrl()).toContain('batchId=abc')
    expect(session.signedImportUrl()).toContain('jwt=token')
  })

  test('processPendingRecords', async () => {
    await expect(session.processPendingRecords(callbackFn)).resolves.toBeInstanceOf(
      RecordChunkIterator
    )
  })

  describe('updateEnvironment', () => {
    test('calls api with payload', async () => {
      const spy = jest.spyOn(flatfile.api as ApiService, 'updateSessionEnv')
      await session.updateEnvironment({ foo: 'bar' })
      expect(spy).toHaveBeenCalledWith(session, { foo: 'bar' })
    })
  })

  describe('openInNewWindow', () => {
    test('triggers window.open', () => {
      const spy = jest.spyOn(window, 'open').mockReturnValue(window)
      session.openInNewWindow()
      expect(spy).toHaveBeenCalled()
    })

    test('throws error if window fails to open', () => {
      jest.spyOn(window, 'open').mockReturnValue(null)
      expect(() => session.openInNewWindow()).toThrow(Error)
    })

    test('emits launch event', () => {
      jest.spyOn(window, 'open').mockReturnValue(window)
      const spy = jest.spyOn(session, 'emit')
      session.openInNewWindow()
      expect(spy).toHaveBeenCalledWith('launch', { batchId: session.batchId })
    })
  })
})
