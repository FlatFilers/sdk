import { ImportSession } from '../../importer/ImportSession'
import { ERecordStatus, FlatfileRecord } from './FlatfileRecord'

export class RecordsChunk {
  constructor(
    private session: ImportSession,
    public readonly records: FlatfileRecord[],
    private meta: {
      status: ERecordStatus
      skip: number
      totalRecords: number
      limit: number
    }
  ) {}

  public get recordIds(): number[] {
    return this.records.map((r) => r.recordId)
  }

  /**
   * Get the next chunk of data based on the current chunk
   */
  public async getNextChunk(): Promise<RecordsChunk | null> {
    const nextSkip = this.meta.skip + this.meta.limit
    if (nextSkip >= this.meta.totalRecords) {
      return null
    }
    return this.session.flatfile.api.getRecordsByStatus(
      this.session,
      this.meta.status,
      nextSkip,
      this.meta.limit
    )
  }

  /**
   * How many chunks are there to process in total
   */
  public get totalChunks(): number {
    return Math.ceil(this.meta.totalRecords / this.meta.limit)
  }

  /**
   * Which chunk is this? (0 indexed)
   */
  public get currentChunkIndex(): number {
    return Math.floor(this.meta.skip / this.meta.limit)
  }
}
