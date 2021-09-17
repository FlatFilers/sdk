let styleElement: HTMLStyleElement

const GLOBAL_CSS = `
  .flatfile-sdk {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    display: none;
    z-index: 100000;
    padding: 40px;
    background-color: rgba(0,0,0,0.15);
  }
  .flatfile-sdk .flatfile-close{
    position: absolute;
    right: 20px;
    top: 15px;
    width: 20px;
    height: 20px;
    background-color: transparent;
    border: none;
    box-shadow: none;
    cursor: pointer;
  }
  .flatfile-sdk .flatfile-close:after{
    display: inline-block;
    content: "X";
    color: white;
  }
  .flatfile-sdk iframe {
    width: calc(100% - 80px);
    height: calc(100% - 80px);
    position: absolute;
    border-width: 0;
    border-radius: 20px;
  }
  body.flatfile-active {
    overflow: hidden;
    overscroll-behavior-x: none;
  }
`

export const insertGlobalCSS = (): void => {
  if (styleElement) {
    return
  }

  styleElement = document.createElement('style')
  styleElement.setAttribute('type', 'text/css')
  document.querySelector('head')?.appendChild(styleElement)

  styleElement.textContent = GLOBAL_CSS
}
