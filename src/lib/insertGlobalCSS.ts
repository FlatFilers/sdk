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
    font-family: 'Avenir Next', sans-serif;
  }
  .flatfile-sdk .flatfile-close {
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
  .flatfile-sdk .flatfile-close:after {
    display: inline-block;
    content: '✕';
    color: white;
    font-size: 20px;
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
  body.flatfile-active .flatfile-sdk {
    display: block;
  }
  .flatfile-sdk .flatfile-loader {
    z-index: 10;
    position: absolute;
    width: calc(100% - 80px);
    height: calc(100% - 80px);
    border-radius: 20px;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .flatfile-sdk .flatfile-loader svg {
    width: 13px;
    height: 13px;
    vertical-align: -3px;
    animation: rotate 1s linear infinite;
    margin-right: 8px;
    width: 24px;
    height: 24px;
    vertical-align: -6px;
    display: inline-block;
  }
  .flatfile-sdk .flatfile-loader svg circle {
    stroke: #3b2fc9;
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }
  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
  @keyframes dash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
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
