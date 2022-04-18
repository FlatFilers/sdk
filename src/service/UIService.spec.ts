import { UIService } from './UIService'

describe('UI Service', () => {
  let ui: UIService
  beforeEach(() => {
    ui = new UIService()
    document.body.innerHTML = ''
  })

  describe('initialize', () => {
    it('should add flatfile sdk container to the document', () => {
      ui.initialize()
      expect(document.querySelector('.flatfile-sdk')).toBeDefined()
    })
  })

  describe('showLoader', () => {
    it('should add flatfile sdk container and loader to the document', () => {
      jest.spyOn(ui, 'initialize')
      ui.showLoader()

      expect(ui.initialize).toHaveBeenCalledTimes(1)
      expect(document.getElementById('flatfile-loader')).toBeDefined()
    })
  })

  describe('hideLoader', () => {
    it('should remove flatfile loader from the document', () => {
      const ui = new UIService()
      ui.showLoader()
      expect(document.getElementById('flatfile-loader')).toBeDefined()

      ui.hideLoader()
      expect(document.getElementById('flatfile-loader')).toBeNull()
    })
  })

  describe('destroy', () => {
    it('should remove flatfile ui from document', () => {
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const untypedUi = ui as any
      expect(document.getElementById('flatfile-loader')).toBeDefined()

      ui.showLoader()
      expect(untypedUi.$loader).toBeDefined()
      expect(untypedUi.$message).toBeDefined()
      expect(document.getElementsByClassName('flatfile-sdk')).toBeDefined()

      ui.destroy()
      expect(untypedUi.$loader).not.toBeDefined()
      expect(untypedUi.$message).not.toBeDefined()
      expect(document.getElementById('flatfile-sdk')).toBeNull()
    })
  })
})
