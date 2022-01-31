import { Flatfile } from '../Flatfile'
import { GetFinalDatabaseViewResponse } from '../graphql/queries/GET_FINAL_DATABASE_VIEW'
import { FlatfileRecord } from '../graphql/service/FlatfileRecord'
import { useOrInit } from '../utils/general'
import { TypedEventManager } from '../utils/TypedEventManager'
import { ImportFrame } from './ImportFrame'

export class Session extends TypedEventManager<IBatchEvents> {
  private $iframe?: ImportFrame
  constructor(public flatfile: Flatfile, public batchId: string) {
    super()
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
   * @todo actually handle chunking
   * @param cb
   * @param options
   */
  public async processPendingRecords(
    cb: (records: FlatfileRecord[], next: () => void) => Promise<void> | void,
    options?: { chunkSize?: number }
  ): Promise<this> {
    return new Promise(async (resolve) => {
      const next = () => {
        resolve(this)
      }
      const skip = 0
      const records = await this.flatfile.api.getFinalDatabaseView(this.batchId, skip)
      cb(
        records.rows.map((r) => new FlatfileRecord(this.flatfile.api, r)),
        next
      )
      return this
    })
  }

  public updateRecords() {}

  public approveRecords() {}

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
              data: (sample = false) =>
                this.flatfile.api.getFinalDatabaseView(this.batchId, 0, sample),
            })
            break
          }
          // todo handle this better
          case 'cancelled': {
            const apiBatch = await this.flatfile.api.init()
            this.emit('init', apiBatch)
            this.batchId = apiBatch.batchId
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
  init: {
    batchId: string
    schemas: {
      id: string
    }[]
    workspaceId: string
  }
  upload: {
    uploadId: string
  }
  error: {
    error: Error
  }
  launch: {
    batchId: string
  }
  submit: Session
  complete: {
    batchId: string
    data: (sample?: boolean) => Promise<GetFinalDatabaseViewResponse['getFinalDatabaseView']>
  }
  close: void
}
