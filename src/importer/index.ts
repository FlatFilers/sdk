import { IEvents, IFlatfileImporter, IFlatfileImporterConfig } from '../types/interfaces'
import { addClass, removeClass } from '../utils/addRemoveClass'
import { insertGlobalCSS } from '../utils/insertGlobalCSS'
import { sign } from '../utils/jwt'
import { ApiService } from './api'
import { cleanup, emit, listen } from './eventManager'

export function flatfileImporter(
  token: string,
  config: IFlatfileImporterConfig = {}
): IFlatfileImporter {
  let destroy: () => void
  let api = new ApiService(token, config.apiUrl || (process.env.API_URL as string))

  const emitClose = () => {
    emit('close')
    cleanup()
  }

  const openInIframe = (batchId?: string) => {
    if (!document.querySelector('.flatfile-sdk')) {
      insertGlobalCSS()
      document.body.insertAdjacentHTML(
        'beforeend',
        `<div class="flatfile-sdk"><button class="flatfile-close"></button></div>`
      )
    }

    const o = document.createElement('iframe')
    o.src = `${config.mountUrl || process.env.MOUNT_URL}/e/?jwt=${encodeURI(api.token)}${
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

  const handleSubscribe = (batchId: string) => {
    api.subscribeBatchStatusUpdated(batchId, async (data) => {
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
          case 'cancelled': {
            const { batchId: newBatchId } = await api.init()
            handleSubscribe(newBatchId)
            break
          }
        }
      }
    })
  }

  return {
    async __unsafeGenerateToken({ embedId, endUserEmail, privateKey }) {
      console.error(
        '[Flatfile SDK]: Using `.__unsafeGenerateToken()` is unsafe and would expose your private key.'
      )

      api = new ApiService(
        await sign(
          {
            embed: embedId,
            sub: endUserEmail,
          },
          privateKey
        ),
        config.apiUrl || (process.env.API_URL as string)
      )
    },
    async launch(): Promise<{ batchId: string }> {
      try {
        const { batchId } = await api.init()

        handleSubscribe(batchId)

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
