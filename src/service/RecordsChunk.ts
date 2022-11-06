import { ImportSession } from '../importer/ImportSession'
import { ERecordStatus, FlatfileRecord } from './FlatfileRecord'

export class RecordsChunk {
  constructor(
    private session: ImportSession,
    public readonly records: FlatfileRecord[],
    private meta: RecordChunkMeta
  ) {}

  public get recordIds(): number[] {
    return this.records.map((r) => r.recordId)
  }

  /**
   * Get the next chunk of data based on the current chunk
   */
  public async getNextChunk(): Promise<RecordsChunk | null> {
    const { index, limit, status } = this.meta ?? {}

    // because we change the status after each chunk rather than waiting to the
    // end we need to make sure to always get the first page as this is only querying
    // for remaining data.
    // TODO: this should be refactored to be more sensible
    const response = await this.session.api.getRecordsByStatus(this.session, status, 0, limit)
    const { rows = [], totalRows } = response ?? {}

    if (response?.totalRows < 1 || rows.length === 0) {
      return null
    }

    return new RecordsChunk(
      this.session,
      rows.map((r) => new FlatfileRecord(r)),
      {
        status,
        skip: 0,
        limit,
        totalRecords: totalRows,
        index: typeof index === 'number' ? index + 1 : undefined,
      }
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
    return this.meta.index || Math.floor(this.meta.skip / this.meta.limit)
  }
}

export type RecordChunkMeta = {
  status: ERecordStatus
  skip: number
  totalRecords: number
  limit: number
  index?: number
}
