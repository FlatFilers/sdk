import { ClientError, GraphQLClient } from 'graphql-request'
import { SubscriptionClient } from 'graphql-subscriptions-client'

import { IImportMeta, ImportSession } from '../importer/ImportSession'
import {
  INITIALIZE_EMPTY_BATCH,
  InitializeEmptyBatchPayload,
  InitializeEmptyBatchResponse,
} from './mutations/INITIALIZE_EMPTY_BATCH'
import { UPDATE_WORKSPACE_ENV } from './mutations/UPDATE_WORKSPACE_ENV'
import {
  GET_FINAL_DATABASE_VIEW,
  GetFinalDatabaseViewPayload,
  GetFinalDatabaseViewResponse,
} from './queries/GET_FINAL_DATABASE_VIEW'
import { PREFLIGHT_BATCH } from './queries/PREFLIGHT_BATCH'
import { UPDATE_RECORD_STATUS } from './queries/UPDATE_RECORDS_STATUS'
import { ERecordStatus, FlatfileRecord, TPrimitive } from './service/FlatfileRecord'
import { RecordsChunk } from './service/RecordsChunk'
import {
  BATCH_STATUS_UPDATED,
  BatchStatusUpdatedResponse,
} from './subscriptions/BATCH_STATUS_UPDATED'

const DEFAULT_PAGE_LIMIT = process.env.DEFAULT_PAGE_LIMIT
  ? parseInt(process.env.DEFAULT_PAGE_LIMIT, 10)
  : 1000

export class ApiService {
  public client: GraphQLClient
  public pubsub: SubscriptionClient

  constructor(public token: string, public apiUrl: string) {
    this.client = new GraphQLClient(`${apiUrl}/graphql`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })
    this.pubsub = new SubscriptionClient(`${apiUrl.replace(/^http/, 'ws')}/graphql`, {
      reconnect: true,
      lazy: true,
      connectionParams: {
        isWebSocket: true,
        headers: {
          authorization: `Bearer ${this.token}`,
        },
      },
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleError(errors?: ClientError['response']['errors'], message?: string): any {
    if (errors?.length) {
      errors.forEach((e) => {
        if (e.message === 'Unauthorized') {
          throw new Error(
            '[Flatfile SDK] Embed ID or Private Key is invalid. Please make sure your JWT contains valid credentials.'
          )
        }

        throw new Error(`[Flatfile SDK]: Internal Server Error: "${e.message}"`)
      })
    }
    throw new Error(`[Flatfile SDK]: ${message || 'Something went wrong'}`)
  }

  async initEmptyBatch(): Promise<InitializeEmptyBatchResponse['initializeEmptyBatch']> {
    return this.client
      .request<InitializeEmptyBatchResponse, InitializeEmptyBatchPayload>(INITIALIZE_EMPTY_BATCH, {
        importedFromUrl: location.href,
      })
      .then(({ initializeEmptyBatch }) => {
        return initializeEmptyBatch
      })
      .catch((error: ClientError) => this.handleError(error.response.errors, error.message))
  }

  async getWorkbookId(batchId: string): Promise<string> {
    return this.client
      .request(PREFLIGHT_BATCH, {
        batchId,
      })
      .then(({ preflightBatch }) => {
        return preflightBatch.workbookId
      })
      .catch((error: ClientError) => this.handleError(error.response.errors, error.message))
  }

  async init(): Promise<IImportMeta> {
    const { batchId, workspaceId, schemas } = await this.initEmptyBatch()
    const workbookId = await this.getWorkbookId(batchId)
    return {
      batchId,
      workspaceId,
      workbookId,
      schemaIds: schemas.map((s) => s.id),
    }
  }

  /**
   * @deprecated
   * @param batchId
   * @param skip
   * @param sample
   */
  async getAllRecords(
    batchId: string,
    skip = 0,
    sample = false
  ): Promise<GetFinalDatabaseViewResponse['getFinalDatabaseView']> {
    return this.client
      .request<GetFinalDatabaseViewResponse, GetFinalDatabaseViewPayload>(GET_FINAL_DATABASE_VIEW, {
        batchId,
        skip,
        limit: DEFAULT_PAGE_LIMIT,
      })
      .then(({ getFinalDatabaseView }) => getFinalDatabaseView)
      .then(async ({ rows, totalRows }) => {
        if (!sample && skip + DEFAULT_PAGE_LIMIT < totalRows) {
          const { rows: nextRows } = await this.getAllRecords(batchId, skip + DEFAULT_PAGE_LIMIT)
          return {
            rows: rows.concat(nextRows),
            totalRows,
          }
        }

        return {
          rows,
          totalRows,
        }
      })
      .catch((error: ClientError) => this.handleError(error.response.errors, error.message))
  }

  /**
   * @param session
   * @param status
   * @param skip
   * @param limit
   */
  async getRecordsByStatus(
    session: ImportSession,
    status: ERecordStatus,
    skip = 0,
    limit = DEFAULT_PAGE_LIMIT
  ): Promise<RecordsChunk> {
    try {
      const res = await this.client
        .request<GetFinalDatabaseViewResponse, GetFinalDatabaseViewPayload>(
          GET_FINAL_DATABASE_VIEW,
          {
            status,
            batchId: session.batchId,
            skip,
            limit,
          }
        )
        .then(({ getFinalDatabaseView }) => getFinalDatabaseView)
      return new RecordsChunk(
        session,
        res.rows.map((r) => new FlatfileRecord(r)),
        {
          status,
          skip: skip,
          limit: limit,
          totalRecords: res.totalRows,
        }
      )
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      throw this.handleError(e.response.errors, e.message)
    }
  }

  public updateRecordStatus(
    session: ImportSession,
    recordIds: number[],
    status: ERecordStatus
  ): Promise<void> {
    return this.client.request(UPDATE_RECORD_STATUS, {
      workbookId: session.meta.workbookId,
      schemaId: parseInt(session.meta.schemaIds[0], 10),
      validationState: status,
      rowIds: recordIds,
    })
  }

  public updateWorkspaceEnv(
    session: ImportSession,
    env: Record<string, TPrimitive>
  ): Promise<void> {
    return this.client.request(UPDATE_WORKSPACE_ENV, {
      workspaceId: session.meta.workspaceId,
      env,
    })
  }

  subscribeBatchStatusUpdated(batchId: string, cb: (d: BatchStatusUpdatedResponse) => void): void {
    this.pubsub
      .request({
        query: BATCH_STATUS_UPDATED,
        variables: {
          batchId,
        },
      })
      .subscribe({
        next: ({
          data,
          errors,
        }: {
          data: BatchStatusUpdatedResponse
          errors: ClientError['response']['errors']
        }) => {
          if (errors) {
            return this.handleError(errors)
          }
          cb(data)
        },
      })
  }
}
