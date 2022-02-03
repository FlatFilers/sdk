import { Flatfile } from '../Flatfile'
import { ImportFrame } from './ImportFrame'
import { ImportSession } from './ImportSession'

describe('ImportSession', () => {
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
    expect(session.signedImportUrl).toContain('batchId=abc')
    expect(session.signedImportUrl).toContain('jwt=asdf')
  })
})
