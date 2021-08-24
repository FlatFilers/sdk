import { insertCss } from 'insert-css'

import { addClass, removeClass } from '../utils/addRemoveClass'
import { sign } from '../utils/jwt'
import { ApiService } from './api'
import { ENVIRONMENT, getConfigByEnv } from './config'
import { cleanup, emit, IEvents, listen } from './eventManager'

interface ILaunchOptions {
  newTab?: boolean // opens in new tab
  attachTo?: HTMLElement // adds an iframe child to the element w/position absolute to fill the element
  data?: Record<string, string | number | boolean | null>[] | string[] | string // data as string or array of objects
  file?: File // launch with file reference
  batchId?: string // resume prior session
}

interface IUnsafeGenerateTokenOptions {
  endUserEmail: string
  privateKey: string
  embedId: string
}

interface IFlatfileImporterResult {
  __unsafeGenerateToken(o: IUnsafeGenerateTokenOptions): Promise<void>
  launch(o: ILaunchOptions): Promise<{ batchId: string }>
  on<K extends keyof IEvents>(event: K, cb: (e: IEvents[K]) => void): void
  close(): void
}
interface IFlatfileImporterOptions {
  env?: ENVIRONMENT
}
export function flatfileImporter(
  token: string,
  options: IFlatfileImporterOptions = {}
): IFlatfileImporterResult {
  const config = getConfigByEnv(options.env)
  let api = new ApiService(token, config)
  const BASE_URL = `${config.mountUrl}/e`

  let destroy: () => void

  const emitClose = () => {
    emit('close')
    cleanup()
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
    o.src = `${BASE_URL}?jwt=${encodeURI(api.token)}${batchId ? `&batchId=${batchId}` : ''}`

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLaunch = async (_options: ILaunchOptions = {}): Promise<{ batchId: string }> => {
    try {
      const { batchId } = await api.init()

      api.subscribeBatchStatusUpdated(batchId).subscribe({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        next: ({ data, errors }: any) => {
          if (errors) {
            // TODO: handle errors
            console.log({ errors })
            return
          }
          if (data?.batchStatusUpdated?.id) {
            switch (data.batchStatusUpdated.status) {
              case 'submitted': {
                emit('complete', {
                  batchId,
                  data: () => api.getFinalDatabaseView(batchId),
                })
                break
              }
            }
          }
        },
      })

      emit('launch', { batchId })

      destroy = openInIframe(batchId)

      return {
        batchId,
      }
    } catch (e) {
      emit('error', e.message)
      cleanup()
      throw new Error(e)
    }
  }

  return {
    async __unsafeGenerateToken({ embedId, endUserEmail, privateKey }) {
      if (!['development', 'staging'].includes(options.env || 'production')) {
        throw new Error('Token cannot be generated in production environment.')
      }

      api = new ApiService(
        await sign(
          {
            embed: embedId,
            sub: endUserEmail,
          },
          privateKey
        ),
        config
      )
    },
    launch(options: ILaunchOptions = {}) {
      return handleLaunch(options)
    },
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
}
