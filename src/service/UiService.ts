import { $, addClass } from '../lib/html'
import { insertGlobalCSS } from '../lib/insertGlobalCSS'

export class UiService {
  private $loader?: HTMLDivElement
  private $message?: Text

  public get $close(): HTMLButtonElement {
    return $<HTMLButtonElement>('.flatfile-close')
  }

  public get $container(): HTMLDivElement {
    return $<HTMLDivElement>('.flatfile-sdk')
  }

  public initializeFlatfileWrapper(): void {
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

  public showLoader(): void {
    this.initializeFlatfileWrapper()
    const loaderContainer = document.createElement('div')
    loaderContainer.setAttribute('id', 'flatfile-loader')
    loaderContainer.append(this.spinner())
    this.$message = document.createTextNode('Connecting to Flatfile...')
    loaderContainer.append(this.$message)
    addClass(loaderContainer, 'flatfile-loader')
    this.$container.append(loaderContainer)
    addClass(document.body, 'flatfile-active')
    this.$loader = loaderContainer
  }

  public hideLoader(): void {
    this.$loader?.remove()
  }

  public updateLoaderMessage(message: string): void {
    if (this.$loader && this.$message) {
      this.$message.remove()
      this.$message = document.createTextNode(message)
      this.$loader?.append(this.$message)
    }
  }

  private spinner(): SVGElement {
    const svg = this.createSVGNode('svg', { viewBox: '0 0 50 50', color: '#3b2fc9' })
    const circle = this.createSVGNode('circle', {
      cx: '25',
      cy: '25',
      r: '20',
      fill: 'none',
      'stroke-width': '5',
    })
    svg.append(circle)
    return svg
  }

  private createSVGNode(tag = 'svg', attributes: Record<string, string>): SVGElement {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag)
    for (const a in attributes) {
      node.setAttributeNS(null, a, attributes[a])
    }
    return node
  }
}
