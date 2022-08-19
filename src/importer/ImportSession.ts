import { Flatfile } from '../Flatfile'
import { ApiService } from '../graphql/ApiService'
import { GetFinalDatabaseViewResponse } from '../graphql/queries/GET_FINAL_DATABASE_VIEW'
import { toQs, useOrInit } from '../lib/general'
import { IteratorCallback, RecordChunkIterator } from '../lib/RecordChunkIterator'
import { TypedEventManager } from '../lib/TypedEventManager'
import { TPrimitive } from '../service/FlatfileRecord'
import { UIService } from '../service/UIService'
import { ITheme } from '../types'
import { ImportFrame } from './ImportFrame'

export class ImportSession extends TypedEventManager<IImportSessionEvents> {
  public ui: UIService
  public api: ApiService
  private $iframe?: ImportFrame

  constructor(public flatfile: Flatfile, public meta: IImportMeta) {
    super()
    this.ui = this.flatfile.ui
    this.api = this.flatfile?.api as ApiService
    this.bubble('error', this.flatfile)
  }

  public get batchId(): string {
    return this.meta.batchId
  }

  public get workbookId(): string | undefined {
    return this.meta.workbookId
  }

  public get schemaId(): number {
    return parseInt(this.meta.schemaIds[0], 10)
  }

  public init(): IImportMeta {
    this.subscribeToBatchStatus()
    this.emit('init', { session: this, meta: this.meta })
    return this.meta
  }

  public get synced(): boolean | undefined {
    return this.meta.synced
  }

  /**
   * Open the importer in an iframe (recommended)
   * todo: move launch event out of iframe helper
   */
  public openInEmbeddedIframe(options?: IUrlOptions, mountingPoint?: string): ImportFrame {
    if (mountingPoint) {
      return this.iframe.mountOn(mountingPoint, options)
    } else {
      return this.iframe.open(options)
    }
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
      chunkSize: options?.chunkSize || 1000,
      chunkTimeout: options?.chunkTimeout || 3000,
    })
    await chunkIterator
      .process()
      .catch(() => console.warn('Something went wrong. Records processing was stopped.'))

    return chunkIterator
  }

  private subscribeToBatchStatus(): void {
    return this.api.subscribeBatchStatusUpdated(this.batchId, async (status) => {
      if (status === 'evaluate') {
        this.emit('evaluate', this)
      }

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
    const autoContinue = options?.autoContinue ?? true
    const qs = {
      jwt: this.api.token,
      ...(this.batchId ? { batchId: this.batchId } : {}),
      ...(autoContinue ? { autoContinue: '1' } : {}),
      ...(options?.theme ? { theme: JSON.stringify(options.theme) } : {}),
      ...(options?.customFields ? { customFields: JSON.stringify(options.customFields) } : {}),
    }
    return `${MOUNT_URL}/e/?${toQs(qs)}`
  }

  /**
   * Close the importer iframe
   * @todo: kill batch status subscription
   */
  public close(): void {
    if (this.$iframe) {
      this.$iframe?.close()
    } else {
      console.warn('No Flatfile importer iframe was found in the DOM.')
    }
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
  /** @deprecated */
  launch: {
    batchId: string
  }
  submit: ImportSession
  complete: {
    batchId: string
    data: (sample?: boolean) => Promise<GetFinalDatabaseViewResponse['getFinalDatabaseView']>
  }
  evaluate: ImportSession
  close: void
}

export interface IImportMeta {
  batchId: string
  mountUrl?: string
  workspaceId: string
  workbookId?: string
  schemaIds: string[]
  synced?: boolean
}

export interface IChunkOptions {
  chunkSize?: number
  chunkTimeout?: number
}
export interface IUrlOptions {
  theme?: ITheme
  autoContinue?: boolean
  customFields?: any
}
