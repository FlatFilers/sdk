import { insertCss } from 'insert-css'

import { ApiService } from './api'
import { ENVIRONMENT, getConfigByEnv } from './config'
import { cleanup, emit, IEvents, listen } from './eventManager'

const addClass = (el: HTMLElement, className: string) => {
  if (el.className === '') return (el.className = className)
  const classes = el.className.split(' ')
  if (classes.indexOf(className) > -1) return
  classes.push(className)
  el.className = classes.join(' ')
}

const removeClass = (el: HTMLElement, className: string): string | undefined => {
  if (el.className === '') return
  const classes = el.className.split(' ')
  const idx = classes.indexOf(className)
  if (idx > -1) classes.splice(idx, 1)
  el.className = classes.join(' ')
}

interface ILaunchOptions {
  newTab?: boolean // opens in new tab
  attachTo?: HTMLElement // adds an iframe child to the element w/position absolute to fill the element
  data?: Record<string, string | number | boolean | null>[] | string[] | string // data as string or array of objects
  file?: File // launch with file reference
  batchId?: string // resume prior session
}

const createCSV = (source: string) =>
  new File([source], 'data.csv', { type: 'text/csv;charset=utf-8;' })

interface ILaunchResult {
  on<K extends keyof IEvents>(event: K, cb: (e: IEvents[K]) => void): void
  close(): void
}
interface IFlatfileImporterOptions {
  env?: ENVIRONMENT
}
export function flatfileImporter(
  token: string,
  options: IFlatfileImporterOptions = {}
): {
  launch(o: ILaunchOptions): ILaunchResult
} {
  const config = getConfigByEnv(options.env)
  const api = new ApiService(token, config)
  const BASE_URL = `${config.mountUrl}/e`

  const emitClose = () => {
    emit('close')
    cleanup()
  }

  const openNewTab = (batchId?: string) => {
    const o = window.open(
      `${BASE_URL}?jwt=${encodeURI(token)}${batchId ? `&batchId=${batchId}` : ''}`,
      '_blank'
    )

    const onClose = setInterval(() => {
      if (o?.closed) {
        clearInterval(onClose)
        emitClose()
      }
    }, 500)

    return () => {
      o?.close()
      emitClose()
    }
  }

  const openInIframe = (batchId?: string) => {
    if (!document.querySelector('.flatfile-sdk')) {
      insertCss(`
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
      `)
      document.body.insertAdjacentHTML(
        'beforeend',
        `<div class="flatfile-sdk"><button class="flatfile-close"></button></div>`
      )
    }

    const o = document.createElement('iframe')
    o.src = `${BASE_URL}?jwt=${encodeURI(token)}${batchId ? `&batchId=${batchId}` : ''}`

    const close = document.querySelector('.flatfile-close') as HTMLElement
    const container = document.querySelector('.flatfile-sdk') as HTMLElement
    container.append(o)
    container.style.display = 'block'

    addClass(document.body, 'flatfile-active')

    const handleClose = () => {
      container.style.display = 'none'
      removeClass(document.body, 'flatfile-active')
      o.remove()
      emitClose()

      close.removeEventListener('click', handleClose)
    }
    close.addEventListener('click', handleClose)

    return () => {
      container.style.display = 'none'
      removeClass(document.body, 'flatfile-active')
      o.remove()
      emitClose()
    }
  }

  // TODO: handle multiple launches
  const handleLaunch = async (options: ILaunchOptions): Promise<(() => void) | void> => {
    try {
      // let file: File | undefined = undefined
      const data = await api.init()

      // if (options.file) {
      //   // check for extension
      //   file = options.file
      // } else if (options.data && typeof options.data === 'string') {
      //   file = createCSV(options.data)
      // }

      // if (file) {
      //   const { uploadId, viewId } = await api.upload(
      //     data.workspaceId,
      //     data.batchId,
      //     data.schemas[0].id,
      //     file
      //   )
      //   console.log({ uploadId, viewId })
      // }

      const subscription = api.subscribeBatchStatusEvents(data.batchId)
      subscription.subscribe({
        next: ({ data, errors }: any) => {
          if (errors) {
            console.log({ errors })
            return
          }
          if (data?.batchStatusUpdated?.id) {
            const { id, status } = data.batchStatusUpdated

            if (status === 'submitted') {
              emit('complete', {
                batchId: id,
                data: () => api.getData(id),
              })
            }
          }
        },
      })

      emit('launch', { batchId: data.batchId })

      // if (options.newTab) {
      //   return openNewTab(data.batchId)
      // }

      return openInIframe(data.batchId)
    } catch ({ message }) {
      emit('error', message)
      cleanup()
    }
  }

  return {
    launch(options: ILaunchOptions = {}) {
      let destroy: () => void
      handleLaunch(options).then((_destroy) => {
        if (_destroy) {
          destroy = _destroy
        }
      })

      return {
        on<K extends keyof IEvents>(event: K, cb: (e: IEvents[K]) => void) {
          listen(event, cb)
        },
        close() {
          if (!destroy) {
            console.error('Could not close the importer because it has not been launched.')
            return
          }
          destroy()
        },
      }
    },
  }
}
