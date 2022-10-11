import { Flatfile } from '../Flatfile'
import { ApiService } from '../graphql/ApiService'
import { IteratorCallback, RecordChunkIterator } from '../lib/RecordChunkIterator'
import { makeRows } from '../lib/test-helper'
import { IBatch } from '../old/graphql/subscriptions/BATCH_STATUS_UPDATED'
import { ImportFrame } from './ImportFrame'
import { ImportSession } from './ImportSession'

jest.mock('../graphql/ApiService')

describe('ImportSession', () => {
  let session: ImportSession
  let callbackFn: IteratorCallback
  let flatfile: Flatfile

  beforeEach(async () => {
    jest.clearAllMocks()
    flatfile = new Flatfile('token', { apiUrl: 'http://localhost:3000' })
    flatfile.api = new ApiService('toke', 'http://localhost:3000')
    session = new ImportSession(flatfile, {
      mountUrl: 'url',
      batchId: 'abc',
      workspaceId: 'def',
      workbookId: 'hij',
      schemaIds: ['99'],
    })
    callbackFn = jest.fn((chunk, next) => next())
    jest
      .spyOn(flatfile.api, 'getRecordsByStatus')
      .mockResolvedValueOnce({ totalRows: 10, rows: makeRows(10, 10) })
      .mockResolvedValueOnce({ totalRows: 0, rows: [] })
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

  describe('init', () => {
    const spy = jest.spyOn(session, 'emit')
    const mockSubscription = (status: string) =>
      jest
        .spyOn(flatfile.api as ApiService, 'subscribeBatchStatusUpdated')
        .mockImplementation((batchId: string, method: (batch: IBatch) => void) =>
          Promise.resolve(method({ id: batchId, status }))
        )

    test('should emit evaluate on batch subscription after init', async () => {
      mockSubscription('evaluate')
      session.init()

      expect(spy).toHaveBeenNthCalledWith(
        1,
        'evaluate',
        expect.objectContaining({
          workbookId: 'hij',
        })
      )
    })

    test('should emit complete on batch subscription after and batch was submitted', async () => {
      mockSubscription('submitted')
      session.init()

      expect(spy).toHaveBeenNthCalledWith(
        2,
        'complete',
        expect.objectContaining({
          batchId: 'abc',
        })
      )
    })

    test('should init if batch got cancelled', async () => {
      mockSubscription('cancelled')

      session.init()

      expect(spy).toHaveBeenCalled()
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

    describe('close', () => {
      test('calls ImportFrame.close if session was opened in iframe mode', () => {
        jest.spyOn(ImportFrame.prototype, 'close')
        session.openInEmbeddedIframe()

        session.close()
        expect(ImportFrame.prototype.close).toHaveBeenCalled()
      })

      test('do not call ImportFrame.close if session was opened in new window', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce((s) => s)
        jest.spyOn(ImportFrame.prototype, 'close')
        session.openInNewWindow()

        session.close()
        expect(ImportFrame.prototype.close).not.toHaveBeenCalled()
        expect(console.warn).toHaveBeenCalled()
      })

      test('do not call ImportFrame.close if Flatfile importer is not opened', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce((s) => s)
        jest.spyOn(ImportFrame.prototype, 'close')

        session.close()
        expect(ImportFrame.prototype.close).not.toHaveBeenCalled()
        expect(console.warn).toHaveBeenCalled()
      })
    })
  })
})
