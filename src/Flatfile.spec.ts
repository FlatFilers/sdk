import { FlatfileError } from './errors/FlatfileError'
import { ImplementationError } from './errors/ImplementationError'
import { Flatfile } from './Flatfile'
import { ApiService } from './graphql/ApiService'
import { ImportSession } from './importer/ImportSession'
import { UIService } from './service/UIService'

window.alert = jest.fn()
window.open = jest.fn(() => window)
jest.mock('./graphql/ApiService')
jest.mock('./lib/jwt', () => ({ sign: jest.fn(() => 'token') }))

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

    describe('when embed id is provided', () => {
      const org = { id: 1, name: 'Flatfile' }
      const user = { id: 1, name: 'John Doe', email: 'john@email.io' }
      const defaultConfig = {
        org: { id: 1, name: 'Company' },
        user: { id: 1, name: 'John Doe', email: 'john@email.com' },
      }

      describe.each([
        ['org', { org }, { org, user: defaultConfig.user }],
        ['user', { user }, { org: defaultConfig.org, user }],
        ['user and org', { org, user }, { org, user }],
        ['no user and no org', {}, defaultConfig],
      ])('and %p info is proided', (_, orgAndUserConfig, expectedOrAndUserConfig) => {
        test('should create a development token', async () => {
          jest.spyOn(Flatfile, 'getDevelopmentToken')
          jest.spyOn(console, 'warn').mockImplementationOnce(() => null)

          const flatfile = new Flatfile({
            embedId: 'embedId',
            apiUrl: 'http://localhost:3000',
            ...orgAndUserConfig,
          })

          await flatfile.startOrResumeImportSession({ open: 'window' })
          expect(console.warn).toHaveBeenCalled()
          expect(Flatfile.getDevelopmentToken).toHaveBeenCalledTimes(1)
          expect(Flatfile.getDevelopmentToken).toHaveBeenCalledWith(
            'embedId',
            expectedOrAndUserConfig
          )
        })
      })
    })

    describe('when no token onAuth callback or user and embedId info is provided', () => {
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
