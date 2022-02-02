import { RequestError } from '../../errors/RequestError'
import { ImportSession } from '../../importer/ImportSession'
import { UPDATE_RECORDS } from '../queries/UPDATE_RECORDS'
import { ClientResponse } from './ClientResponse'
import { RecordError } from './RecordError'

export class PartialRejection extends ClientResponse {
  private errors: RecordError[]
  constructor(recordOrRecords: RecordError | RecordError[]) {
    super()
    if (Array.isArray(recordOrRecords)) {
      this.errors = recordOrRecords
    } else {
      this.errors = [recordOrRecords]
    }
  }

  public get recordIds(): number[] {
    return this.errors.map((r) => r.recordId)
  }

  async executeResponse(session: ImportSession): Promise<this> {
    const client = session.flatfile.api.client
    await client
      .request(UPDATE_RECORDS, {
        batchId: session.batchId,
        edits: this.errors.map((r) => r.toGraphQLEdits()),
      })
      .catch((err) => {
        throw new RequestError(err)
      })

    return this
  }
}
