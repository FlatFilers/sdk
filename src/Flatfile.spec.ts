import { FlatfileError } from './errors/FlatfileError'
import { ImplementationError } from './errors/ImplementationError'
import { Flatfile } from './Flatfile'
import { ApiService } from './graphql/ApiService'
import { ImportSession } from './importer/ImportSession'
import { UIService } from './service/UIService'

window.alert = jest.fn()
window.open = jest.fn(() => window)
jest.mock('./graphql/ApiService')

const fakeImportMeta = { batchId: 'bId', workspaceId: 'wId', schemaIds: [] }

describe('Flatfile', () => {
  let flatfile: Flatfile

  beforeEach(async () => {
    jest.clearAllMocks()
    flatfile = new Flatfile('token', { apiUrl: 'http://localhost:3000' })
    jest.spyOn(ApiService.prototype, 'init').mockResolvedValue(fakeImportMeta)
  })

  describe('startOrResumeImportSession', () => {
    describe('when open option is equals to "window"', () => {
      test('should open flatfile importer in new window ', async () => {
        jest.spyOn(ImportSession.prototype, 'openInNewWindow')
        await flatfile.startOrResumeImportSession({ open: 'window' })
        expect(ImportSession.prototype.openInNewWindow).toHaveBeenCalledTimes(1)
        expect(ImportSession.prototype.openInNewWindow).toHaveBeenCalledWith(
          expect.objectContaining({ autoContinue: undefined })
        )
      })
    })

    describe('when open option is equals to "iframe"', () => {
      test('should open flatfile importer inside iframe', async () => {
        jest.spyOn(ImportSession.prototype, 'openInEmbeddedIframe')
        await flatfile.startOrResumeImportSession({ open: 'iframe' })
        expect(ImportSession.prototype.openInEmbeddedIframe).toHaveBeenCalledTimes(1)
        expect(ImportSession.prototype.openInEmbeddedIframe).toHaveBeenCalledWith(
          expect.objectContaining({ autoContinue: undefined })
        )
      })
    })

    describe('when an error is trown from api', () => {
      test('should handle thrown error', async () => {
        const error = new FlatfileError()
        jest.spyOn(UIService.prototype, 'destroy')
        jest.spyOn(flatfile, 'handleError')
        jest.spyOn(flatfile, 'cleanup')
        jest.spyOn(ApiService.prototype, 'init').mockRejectedValue(error)

        const fn = () => flatfile.startOrResumeImportSession({ open: 'window' })
        await expect(fn).rejects.toThrow(Error)
        expect(flatfile.cleanup).toHaveBeenCalled()
        expect(flatfile.handleError).toHaveBeenCalledWith(error)
        expect(UIService.prototype.destroy).toHaveBeenCalled()
      })
    })

    describe('when no token or onAuth callback is provided', () => {
      test('should throw implementation error', async () => {
        const flatfile = new Flatfile({ apiUrl: 'http://localhost:3000' })
        jest.spyOn(UIService.prototype, 'destroy')
        jest.spyOn(flatfile, 'handleError')
        jest.spyOn(flatfile, 'cleanup')

        const fn = () => flatfile.startOrResumeImportSession({ open: 'window' })
        await expect(fn).rejects.toThrow(ImplementationError)
        expect(flatfile.cleanup).toHaveBeenCalled()
        expect(flatfile.handleError).toHaveBeenCalled()
        expect(UIService.prototype.destroy).toHaveBeenCalled()
      })
    })

    test('should not display loader when no "open" option is provided', async () => {
      jest.spyOn(UIService.prototype, 'showLoader')
      await flatfile.startOrResumeImportSession()
      expect(UIService.prototype.showLoader).not.toHaveBeenCalled()
    })
  })
})
