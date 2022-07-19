import { ChunkTimeoutError } from '../errors/ChunkTimeoutError'
import { ChunkTimeoutExpiredError } from '../errors/ChunkTimeoutExpiredError'
import { FlatfileError } from '../errors/FlatfileError'
import { ApiService } from '../graphql/ApiService'
import { ImportSession } from '../importer/ImportSession'
import { ERecordStatus } from '../service/FlatfileRecord'
import { PartialRejection } from '../service/PartialRejection'
import { RecordsChunk } from '../service/RecordsChunk'
import { TypedEventManager } from './TypedEventManager'

export class RecordChunkIterator extends TypedEventManager<IIteratorEvents> {
  /**
   * Reference to API service for
   * @private
   */
  public api: ApiService

  /**
   * Tracks the IDs of the records that have been accepted from all chunks
   */
  public acceptedIds: number[] = []

  /**
   * Tracks the IDs of the records that have been rejected in all chunks
   */
  public rejectedIds: number[] = []

  /**
   * This is a placeholder for the external function used for processing the chunk
   * @private
   */
  private readonly callback: IteratorCallback

  /**
   * Holds the timeout tracking the time spent while running the callback
   */
  private timerId?: ReturnType<typeof setTimeout>

  /**
   * Its true if the data processing was stopped
   */
  private isProcessingStopped = false

  constructor(
    private session: ImportSession,
    callback: IteratorCallback,
    private options: { chunkSize: number; chunkTimeout: number }
  ) {
    super()
    this.callback = callback
    this.api = session.api
    this.bubble('error', session)
  }

  /**
   * Is run after each chunk is processed and receives the response from each callback
   *
   * @param prevChunk
   * @param err
   */
  public async afterEach(prevChunk: RecordsChunk, err?: PartialRejection | Error): Promise<void> {
    const promises = []

    const rejectedIds = err instanceof PartialRejection ? err.recordIds : []
    promises.push(this.api.updateRecordStatus(this.session, this.rejectedIds, ERecordStatus.REVIEW))

    const acceptedIds = prevChunk.recordIds.filter((recordId) => !rejectedIds.includes(recordId))
    promises.push(this.api.updateRecordStatus(this.session, acceptedIds, ERecordStatus.ACCEPTED))

    await Promise.all(promises)

    if (err instanceof PartialRejection) {
      await err.executeResponse(this.session)
    } else if (err) {
      throw err
    }
  }

  /**
   * Used to load the first payload for the first chunk
   */
  public beforeFirst(): Promise<RecordsChunk> {
    // with "buffer" all records have status submitted
    // we should only do this in new submit flow
    return this.api.getRecordsByStatus(
      this.session,
      ERecordStatus.SUBMITTED,
      0,
      this.options.chunkSize
    )
  }

  /**
   * Gets run before each chunk except the first one.
   *
   * @param chunk
   */
  public beforeOthers(chunk: RecordsChunk): Promise<RecordsChunk | null> {
    return chunk.getNextChunk()
  }

  /**
   * Process the next chunk in the series or complete the process.
   *
   * @param chunk
   * @param err
   */
  public async next(chunk: RecordsChunk, err?: PartialRejection | Error): Promise<void> {
    try {
      if (this.timerId) {
        clearTimeout(this.timerId)
      }
      if (this.isProcessingStopped) {
        throw new ChunkTimeoutExpiredError('Error ')
      }
      await this.afterEach(chunk, err)
      const newChunk = await this.beforeOthers(chunk)
      if (newChunk) {
        this.runCallback(newChunk)
      } else {
        await this.afterAll()
      }
    } catch (error) {
      this.stopDataProcessing(error as FlatfileError)
    }
  }

  /**
   * Run through this chunk iterator once using the available rules.
   */
  public process(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const chunk = await this.beforeFirst()
      this.runCallback(chunk)
      this.on('complete', (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * After all the chunks have finished iterating. This hook is run to wrap things up
   */
  public async afterAll(): Promise<void> {
    this.emit('complete')
  }

  /**
   * Runs the iterator callback function and adds a timeout tracking the time spent running it.
   * If the iterator callback takes longer than expected, an error is emitted.
   */
  private runCallback(chunk: RecordsChunk): Promise<void> | void {
    this.timerId = setTimeout(() => {
      this.timerId = undefined
      console.warn('Did you forget to call next() inside your onData callback?')
      this.stopDataProcessing(new ChunkTimeoutError())
    }, this.options.chunkTimeout)

    return this.callback(chunk, (err) => this.next(chunk, err))
  }

  /**
   * Handles the errors that produce an stop in the records processing.
   * Only emits a 'complete' event the first time it is called (or when 'isProcessingStopped' flag is false).
   */
  private stopDataProcessing(error: FlatfileError): void {
    this.emit('error', { error })
    if (!this.isProcessingStopped) {
      this.emit('complete', error)
      this.isProcessingStopped = true
    }
  }
}

export type IteratorCallback = (
  chunk: RecordsChunk,
  next: (res?: PartialRejection | Error) => void
) => Promise<void> | void

export interface IIteratorEvents {
  complete?: Error
  error: { error: Error }
}
