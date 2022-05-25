import { $, addClass, removeClass } from '../lib/html'
import { TypedEventManager } from '../lib/TypedEventManager'
import { UIService } from '../service/UIService'
import { ImportSession, IUrlOptions } from './ImportSession'

export interface IImportFrameEvents {
  load: void
}

export class ImportFrame extends TypedEventManager<IImportFrameEvents> {
  public ui: UIService
  private $iframe?: HTMLIFrameElement

  constructor(private session: ImportSession, private selector?: string) {
    super()
    this.ui = this.session.ui
    this.close = this.close.bind(this)
  }

  public open(options?: IUrlOptions, mountOn?: string): this {
    this.ui.initialize()
    const url = this.session.signedImportUrl(options)
    const iFrameEl = this.createIFrameElement(url, mountOn)
    iFrameEl.addEventListener('load', () => this.emit('load'))
    if (!mountOn) {
      this.ui.$container.append(iFrameEl)
      addClass(document.body, 'flatfile-active')
    }
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

    this.ui.$close?.removeEventListener('click', this.close)
  }

  private createIFrameElement(url: string, mountOn?: string): HTMLIFrameElement {
    const iframeElement = mountOn ? $<HTMLIFrameElement>(mountOn) : document.createElement('iframe')
    iframeElement.src = url
    return (this.$iframe = iframeElement)
  }
}
