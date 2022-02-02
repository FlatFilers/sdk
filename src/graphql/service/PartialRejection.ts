import { ImportSession } from '../../importer/ImportSession'
import { UPDATE_RECORDS } from '../queries/UPDATE_RECORDS'
import { ClientResponse } from './ClientResponse'
import { RecordError } from './RecordError'

export class PartialRejection extends ClientResponse {
  private records: RecordError[]
  constructor(recordOrRecords: RecordError | RecordError[]) {
    super()
    if (Array.isArray(recordOrRecords)) {
      this.records = recordOrRecords
    } else {
      this.records = [recordOrRecords]
    }
  }

  public get recordIds(): number[] {
    return this.records.map((r) => r.recordId)
  }

  async executeResponse(session: ImportSession): Promise<this> {
    const client = session.flatfile.api.client
    await client.request(UPDATE_RECORDS, {
      batchId: session.batchId,
      edits: this.records.map((r) => r.toGraphQLEdits()),
    })

    // @todo proper handling of errors here

    return this
  }
}
