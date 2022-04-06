import { addClass, removeClass } from '../lib/html'
import { UiService } from '../service/UiService'
import { ImportSession, IUrlOptions } from './ImportSession'

export class ImportFrame {
  public ui: UiService
  private $iframe?: HTMLIFrameElement
  constructor(private session: ImportSession) {
    this.ui = new UiService()
    this.close = this.close.bind(this)
  }

  public open(options?: IUrlOptions): this {
    this.ui.initializeFlatfileWrapper()
    const url = this.session.signedImportUrl(options)
    const iFrameEl = this.createIFrameElement(url)
    this.ui.$container.append(iFrameEl)
    addClass(document.body, 'flatfile-active')
    this.session.emit('launch')

    this.ui.$close.addEventListener('click', this.close)
    return this
  }

  /**
   * todo: handle the close better, support cleaner transition
   */
  public close(): void {
    removeClass(document.body, 'flatfile-active')
    this.$iframe?.remove()
    this.session.emit('close')

    this.ui.$close.removeEventListener('click', this.close)
  }

  private createIFrameElement(url: string): HTMLIFrameElement {
    const iframeElement = document.createElement('iframe')
    iframeElement.src = url
    return (this.$iframe = iframeElement)
  }
}
