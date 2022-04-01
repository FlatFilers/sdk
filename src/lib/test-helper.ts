import nock, { Scope } from 'nock'

import { ImportSession } from '../importer/ImportSession'
import { ERecordStatus, FlatfileRecord } from '../service/FlatfileRecord'
import { BASE_RECORD } from '../service/FlatfileRecord.spec'
import { RecordsChunk } from '../service/RecordsChunk'

/**
 * Mock a graphql response and expect n invocations
 *
 * @param reqName
 * @param responseCode
 * @param payload
 * @param times
 */
export const mockGraphQLRequest = (
  reqName: string,
  responseCode = 200,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any = {},
  times = 1
): Scope => {
  return nock(/.+/)
    .post('/graphql')
    .times(times)
    .reply(
      responseCode,
      responseCode === 200
        ? {
            data: {
              [reqName]: payload,
            },
          }
        : payload
    )
}

/**
 * Create a record chunk within paramaters for testing purposes
 *
 * @param session
 * @param records
 * @param totalRecords
 * @param skip
 * @param limit
 */
export function createChunk(
  session: ImportSession,
  records: FlatfileRecord[],
  totalRecords = 100,
  skip = 0,
  limit = 50
): RecordsChunk {
  return new RecordsChunk(session, records, {
    status: ERecordStatus.REVIEW,
    skip,
    totalRecords,
    limit,
  })
}

/**
 * Make a series of sample records for testing purposes
 *
 * @param start
 * @param limit
 */
export function makeRecords(start = 0, limit = 10): FlatfileRecord[] {
  const list = []
  const highEnd = start + limit
  for (let i = start + 1; i <= highEnd; i++) {
    list.push(i)
  }
  return list.map((id) => new FlatfileRecord({ ...BASE_RECORD, id }))
}
