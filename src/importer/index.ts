import { ApiService } from './api'
import { emit, IEvents, listen, cleanup } from './eventManager'

interface ILaunchOptions {
  newTab?: boolean // opens in new tab
  attachTo?: HTMLElement // adds an iframe child to the element w/position absolute to fill the element
  data?: Record<string, any>[] | string[] | string // data as string or array of objects
  file?: File // launch with file reference
  batchId?: string // resume prior session
}

const createCSV = (source: string) => new File([source], 'data.csv', { type: 'text/csv;charset=utf-8;' })

export function flatfileImporter(token: string){
  const api = new ApiService(token)
  const BASE_URL = 'http://localhost:8080/p/taycan/'
  // const BASE_URL = 'https://app.flatfile.io/embed/'

  const openNewTab = (batchId?: string) => {
    const o = window.open(`${BASE_URL}${btoa(token)}${batchId ? `?batchId=${batchId}` : ''}`, '_blank')

    return () => {
      o.close()
    }
  }

  const handleLaunch = async (options: ILaunchOptions): Promise<() => void | void> => {
    try{
      let file: File
      const data = await api.init()

      if(options.file){
        // check for extension
        file = options.file
      } else if(options.data && typeof options.data === 'string'){
        file = createCSV(options.data)
      }

      if(file){
        const {uploadId, viewId} = await api.upload(data.workspaceId, data.batchId, data.schemas[0].id, file)
        console.log({uploadId, viewId})
      }

      console.log({data})

      emit('launch', {batchId: data.batchId})
      return openNewTab(data.batchId)
    }catch({message}){
      emit('error', message)
      cleanup()
    }
  }

  return {
    launch(options: ILaunchOptions = {}){
      let destroy: any;
      handleLaunch(options)
        .then(_destroy => {
          if(_destroy){
            destroy = _destroy
          }
        })
      

      return {
        on<K extends keyof IEvents>(event: K, cb: (e: IEvents[K]) => void){
          listen(event, cb)
        },
        close() {
          if(!destroy){
            console.error('Could not close the importer because it has not been launched.')
            return
          }
          emit('close')
          cleanup()
          destroy()
        }
      }
    }
  }
}