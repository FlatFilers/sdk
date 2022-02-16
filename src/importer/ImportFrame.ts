import { $, addClass, removeClass } from '../lib/html'
import { insertGlobalCSS } from '../lib/insertGlobalCSS'
import { ImportSession, IUrlOptions } from './ImportSession'

export class ImportFrame {
  private $iframe?: HTMLIFrameElement
  constructor(private batch: ImportSession) {}

  public open(options?: IUrlOptions): this {
    this.initializeFlatfileWrapper()
    const url = this.batch.signedImportUrl(options)
    const iFrameEl = this.createIFrameElement(url)
    this.$container.append(iFrameEl)
    addClass(document.body, 'flatfile-active')
    this.batch.emit('launch')

    this.$close.addEventListener('click', this.close)
    return this
  }

  /**
   * todo: handle the close better, support cleaner transition
   */
  public close(): void {
    removeClass(document.body, 'flatfile-active')
    this.$iframe?.remove()
    this.batch.emit('close')

    this.$close.removeEventListener('click', this.close)
  }

  private createIFrameElement(url: string): HTMLIFrameElement {
    const iframeElement = document.createElement('iframe')
    iframeElement.src = url
    return (this.$iframe = iframeElement)
  }

  private initializeFlatfileWrapper(): void {
    if (!this.$container) {
      insertGlobalCSS()
      document.body.insertAdjacentHTML(
        'beforeend',
        `<div class="flatfile-sdk">
                 <button class="flatfile-close"></button>
               </div>`
      )
    }
  }

  private get $close(): HTMLButtonElement {
    return $<HTMLButtonElement>('.flatfile-close')
  }

  private get $container(): HTMLDivElement {
    return $<HTMLDivElement>('.flatfile-sdk')
  }
}
