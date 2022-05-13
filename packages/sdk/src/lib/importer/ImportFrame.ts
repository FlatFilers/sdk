import { addClass, removeClass } from '../lib/html'
import { TypedEventManager } from '../lib/TypedEventManager'
import { UIService } from '../service/UIService'
import { ImportSession, IUrlOptions } from './ImportSession'

export interface IImportFrameEvents {
  load: void
}

export class ImportFrame extends TypedEventManager<IImportFrameEvents> {
  public ui: UIService
  private $iframe?: HTMLIFrameElement

  constructor(private session: ImportSession) {
    super()
    this.ui = this.session.ui
    this.close = this.close.bind(this)
  }

  public open(options?: IUrlOptions): this {
    this.ui.initialize()
    const url = this.session.signedImportUrl(options)
    const iFrameEl = this.createIFrameElement(url)
    iFrameEl.addEventListener('load', () => this.emit('load'))
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

    this.ui.$close?.removeEventListener('click', this.close)
  }

  private createIFrameElement(url: string): HTMLIFrameElement {
    const iframeElement = document.createElement('iframe')
    iframeElement.src = url
    return (this.$iframe = iframeElement)
  }
}
