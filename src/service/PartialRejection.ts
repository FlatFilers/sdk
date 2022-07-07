import { RequestError } from '../errors/RequestError'
import { UPDATE_RECORDS } from '../graphql/queries/UPDATE_RECORDS'
import { ImportSession } from '../importer/ImportSession'
import { ClientResponse } from './ClientResponse'
import { RecordError } from './RecordError'

export class PartialRejection extends ClientResponse {
  /**
   * Cache of the records being rejected
   * @private
   */
  private errors: RecordError[]

  constructor(recordOrRecords: RecordError | RecordError[]) {
    super()
    if (Array.isArray(recordOrRecords)) {
      this.errors = recordOrRecords
    } else {
      this.errors = [recordOrRecords]
    }
  }

  /**
   * Return an array of IDs that have been rejected
   */
  public get recordIds(): number[] {
    return this.errors.map((r) => r.recordId)
  }

  /**
   * Update records on the server with the errors or mutations that are provided.
   *
   * @param session
   */
  async executeResponse(session: ImportSession): Promise<this> {
    // todo: we should move this to ApiService
    const client = session.api.client
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
