import { UiService } from './UiService'

describe('RecordMutation', () => {
  let ui: UiService
  beforeEach(() => {
    ui = new UiService()
  })

  describe('initializeFlatfileWrapper', () => {
    it('should add flatffile sdk container to the document', () => {
      ui.initializeFlatfileWrapper()
      expect(document.querySelector('.flatfile-sdk')).toBeDefined()
    })
  })

  describe('showLoader', () => {
    it('should add flatffile sdk container to the document', () => {
      jest.spyOn(ui, 'initializeFlatfileWrapper')
      ui.initializeFlatfileWrapper()

      expect(ui.initializeFlatfileWrapper).toHaveBeenCalledTimes(1)
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
})
