import { insertCss } from 'insert-css'

import { IFlatfileImporter } from '../types/interfaces'
import { addClass, removeClass } from '../utils/addRemoveClass'
import { sign } from '../utils/jwt'
import { ApiService } from './api'
import { cleanup, emit, IEvents, listen } from './eventManager'

export function flatfileImporter(token: string): IFlatfileImporter {
  let destroy: () => void
  let api = new ApiService(token)

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
    o.src = `${process.env.MOUNT_URL}/e?jwt=${encodeURI(api.token)}${
      batchId ? `&batchId=${batchId}` : ''
    }`

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

  return {
    async __unsafeGenerateToken({ embedId, endUserEmail, privateKey }) {
      if (process.env.NODE_ENV === 'production') {
        console.error(
          'Using `.__unsafeGenerateToken()` is unsafe and would expose your private key.'
        )
      }

      api = new ApiService(
        await sign(
          {
            embed: embedId,
            sub: endUserEmail,
          },
          privateKey
        )
      )
    },
    async launch(): Promise<{ batchId: string }> {
      try {
        const { batchId } = await api.init()

        api.subscribeBatchStatusUpdated(batchId, (data) => {
          if (data?.batchStatusUpdated?.id) {
            switch (data.batchStatusUpdated.status) {
              case 'submitted': {
                emit('complete', {
                  batchId,
                  data: (sample = false) => api.getFinalDatabaseView(batchId, 0, sample),
                })
                destroy?.()
                break
              }
            }
          }
        })

        emit('launch', { batchId })

        destroy = openInIframe(batchId)

        return {
          batchId,
        }
      } catch (e) {
        cleanup()
        throw e
      }
    },
    on<K extends keyof IEvents>(event: K, cb: (e: IEvents[K]) => void) {
      listen(event, cb)
    },
    close() {
      if (!destroy) {
        throw new Error(
          '[Flatfile SDK] Could not close the importer because it has not been launched.'
        )
      }
      destroy()
    },
  }
}
