import { Flatfile } from 'Flatfile'
import { UIService } from 'service/UIService'

import { ApiService } from '../graphql/ApiService'
import { GetFinalDatabaseViewResponse } from '../graphql/queries/GET_FINAL_DATABASE_VIEW'
import { toQs, useOrInit } from '../lib/general'
import { IteratorCallback, RecordChunkIterator } from '../lib/RecordChunkIterator'
import { TypedEventManager } from '../lib/TypedEventManager'
import { TPrimitive } from '../service/FlatfileRecord'
import { ImportFrame } from './ImportFrame'

export class ImportSession extends TypedEventManager<IImportSessionEvents> {
  public ui: UIService
  public api: ApiService
  private $iframe?: ImportFrame

  constructor(public flatfile: Flatfile, public meta: IImportMeta) {
    super()
    this.ui = this.flatfile.ui
    this.api = this.flatfile?.api as ApiService
  }

  public get batchId(): string {
    return this.meta.batchId
  }

  public async init(): Promise<IImportMeta> {
    this.subscribeToBatchStatus()
    this.emit('init', { session: this, meta: this.meta })
    return this.meta
  }

  /**
   * Open the importer in an iframe (recommended)
   * todo: move launch event out of iframe helper
   */
  public openInEmbeddedIframe(options?: IUrlOptions): ImportFrame {
    return this.iframe.open(options)
  }

  /**
   * Open the import in a new window and listen for data
   */
  public openInNewWindow(options?: IUrlOptions): Window {
    const newWindow = window.open(this.signedImportUrl(options))
    if (!newWindow) {
      throw new Error('Could not initialize window. Possibly prevented by popup blocker')
    }
    this.emit('launch', { batchId: this.batchId })
    return newWindow
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
    return this.api.updateSessionEnv(this, env)
  }

  /**
   * Chunk and handle data response
   * @param cb
   * @param options
   */
  public async processPendingRecords(
    cb: IteratorCallback,
    options?: IChunkOptions
  ): Promise<RecordChunkIterator> {
    // temp hack because workbook ID is not available during init yet
    this.meta.workbookId = await this.api.getWorkbookId(this.batchId)

    const chunkIterator = new RecordChunkIterator(this, cb, {
      chunkSize: options?.chunkSize || 100,
    })
    await chunkIterator.process()

    /**
     * close the iframe if none of the records were rejected
     */
    if (chunkIterator.rejectedIds.length === 0) {
      // return the chunk iterator
      this.iframe?.close()
    }

    return chunkIterator
  }

  private subscribeToBatchStatus(): void {
    return this.api.subscribeBatchStatusUpdated(this.batchId, async (status) => {
      if (status === 'submitted') {
        this.emit('submit', this)
        this.emit('complete', {
          batchId: this.batchId,
          data: (sample = false) => this.api.getAllRecords(this.batchId, 0, sample),
        })
      }

      if (status === 'cancelled') {
        const meta = await this.api.init()
        this.meta = { ...this.meta, ...meta }
        this.init()
      }
    })
  }

  /**
   * Get the URL necessary to load the importer and manipulate the data
   * @todo fix the fact that the JWT is sent in raw query params
   */
  public signedImportUrl(options?: IUrlOptions): string {
    const MOUNT_URL = this.meta.mountUrl
    const qs = {
      jwt: this.api.token,
      ...(this.batchId ? { batchId: this.batchId } : {}),
      ...(options?.autoContinue ? { autoContinue: '1' } : {}),
    }
    return `${MOUNT_URL}/e?${toQs(qs)}`
  }
}

export interface IImportSessionEvents {
  init: {
    session: ImportSession
    meta: IImportMeta
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
  submit: ImportSession
  complete: {
    batchId: string
    data: (sample?: boolean) => Promise<GetFinalDatabaseViewResponse['getFinalDatabaseView']>
  }
  close: void
}

export interface IImportMeta {
  batchId: string
  mountUrl?: string
  workspaceId: string
  workbookId?: string
  schemaIds: string[]
}

export interface IChunkOptions {
  chunkSize?: number
}
export interface IUrlOptions {
  autoContinue?: boolean
}
