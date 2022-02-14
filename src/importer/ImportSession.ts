import { Flatfile } from '../Flatfile'
import { GetFinalDatabaseViewResponse } from '../graphql/queries/GET_FINAL_DATABASE_VIEW'
import { useOrInit } from '../lib/general'
import { IteratorCallback, RecordChunkIterator } from '../lib/RecordChunkIterator'
import { TypedEventManager } from '../lib/TypedEventManager'
import { TPrimitive } from '../service/FlatfileRecord'
import { ImportFrame } from './ImportFrame'

export class ImportSession extends TypedEventManager<IBatchEvents> {
  private $iframe?: ImportFrame
  public batchId: string
  constructor(public flatfile: Flatfile, public meta: IImportMeta) {
    super()
    this.batchId = meta.batchId
    setTimeout(() => this.emit('init', meta))
    this.subscribeToBatchStatus() // todo this shouldn't happen here
  }

  /**
   * Open the importer in an iframe (recommended)
   * todo: move launch event out of iframe helper
   */
  public openInEmbeddedIframe(): ImportFrame {
    return this.iframe.open()
  }

  /**
   * Returns the iframe helper, useful in more advanced implementations
   */
  public get iframe(): ImportFrame {
    return useOrInit(this.$iframe, () => (this.$iframe = new ImportFrame(this)))
  }

  /**
   * Update the environment with unsigned values
   * @param env
   */
  public async updateEnvironment(env: Record<string, TPrimitive>): Promise<{ success: boolean }> {
    return this.flatfile.api.updateSesssionEnv(this, env)
  }

  /**
   * Chunk and handle data response
   * @param cb
   * @param options
   */
  public async processPendingRecords(cb: IteratorCallback, options?: IChunkOptions): Promise<void> {
    // temp hack because workbook ID is not available during init yet
    this.meta.workbookId = await this.flatfile.api.getWorkbookId(this.batchId)

    await new RecordChunkIterator(this, cb, { chunkSize: options?.chunkSize || 100 }).process()
  }

  /**
   * Open the import in a new window and listen for data
   */
  public openInNewWindow(): Window {
    const newWindow = window.open(this.signedImportUrl)
    if (!newWindow) {
      throw new Error('Could not initialize window. Possibly prevented by popup blocker')
    }
    this.emit('launch', { batchId: this.batchId })
    return newWindow
  }

  /**
   * @todo make this less lines and more readable
   */
  private subscribeToBatchStatus(): void {
    this.flatfile.api.subscribeBatchStatusUpdated(this.batchId, async (data) => {
      if (data?.batchStatusUpdated?.id) {
        switch (data.batchStatusUpdated.status) {
          case 'submitted': {
            this.emit('submit', this)
            this.emit('complete', {
              batchId: this.batchId,
              data: (sample = false) => this.flatfile.api.getAllRecords(this.batchId, 0, sample),
            })
            break
          }
          // todo handle this better
          case 'cancelled': {
            const apiBatch = await this.flatfile.api.init()
            this.emit('init', apiBatch)
            this.batchId = apiBatch.batchId
            this.meta = apiBatch
            // todo unsubscribe from old batch
            this.subscribeToBatchStatus()
            break
          }
        }
      }
    })
  }

  /**
   * Get the URL necessary to load the importer and manipulate the data
   * @todo fix the fact that the JWT is sent in raw query params
   */
  public get signedImportUrl(): string {
    const MOUNT_URL = this.flatfile.config.mountUrl
    const TOKEN = encodeURI(this.flatfile.token)
    return `${MOUNT_URL}/e?jwt=${TOKEN}${this.batchId ? `&batchId=${this.batchId}` : ''}`
  }
}

export interface IBatchEvents {
  init: IImportMeta
  upload: {
    uploadId: string
  }
  error: {
    error: Error
  }
  launch: {
    batchId: string
  }
  submit: ImportSession
  complete: {
    batchId: string
    data: (sample?: boolean) => Promise<GetFinalDatabaseViewResponse['getFinalDatabaseView']>
  }
  close: void
}

export interface IImportMeta {
  batchId: string
  workspaceId: string
  workbookId?: string
  schemaIds: string[]
}

export interface IChunkOptions {
  chunkSize?: number
}
