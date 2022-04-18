import { UIService } from './UIService'

describe('RecordMutation', () => {
  let ui: UIService
  beforeEach(() => {
    ui = new UIService()
  })

  describe('initialize', () => {
    it('should add flatffile sdk container to the document', () => {
      ui.initialize()
      expect(document.querySelector('.flatfile-sdk')).toBeDefined()
    })
  })

  describe('showLoader', () => {
    it('should add flatffile sdk container to the document', () => {
      jest.spyOn(ui, 'initialize')
      ui.initialize()

      expect(ui.initialize).toHaveBeenCalledTimes(1)
      expect(document.getElementById('flatfile-loader')).toBeDefined()
    })
  })

  describe('hideLoader', () => {
    it('should add flatffile sdk container to the document', () => {
      ui.showLoader()
      expect(document.getElementById('flatfile-loader')).toBeDefined()

      ui.hideLoader()
      expect(document.getElementById('flatfile-loader')).toBeNull()
    })
  })

  describe('destroy', () => {
    it('should remove flatfile sdk wrapper from document', () => {
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
