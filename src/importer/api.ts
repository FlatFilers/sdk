import { ClientError, GraphQLClient } from 'graphql-request'
import { SubscriptionClient } from 'graphql-subscriptions-client'

import {
  INITIALIZE_EMPTY_BATCH,
  InitializeEmptyBatchPayload,
  InitializeEmptyBatchResponse,
} from '../graphql/mutations/INITIALIZE_EMPTY_BATCH'
import {
  GET_FINAL_DATABASE_VIEW,
  GetFinalDatabaseViewPayload,
  GetFinalDatabaseViewResponse,
} from '../graphql/queries/GET_FINAL_DATABASE_VIEW'
import {
  BATCH_STATUS_UPDATED,
  BatchStatusUpdatedResponse,
} from '../graphql/subscriptions/BATCH_STATUS_UPDATED'
import { emit } from './eventManager'

export class ApiService {
  private client: GraphQLClient
  private pubsub: SubscriptionClient

  constructor(public token: string) {
    this.client = new GraphQLClient(`${process.env.API_URL}/graphql`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })
    this.pubsub = new SubscriptionClient(`${process.env.WS_URL}/graphql`, {
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

  async init(): Promise<InitializeEmptyBatchResponse['initializeEmptyBatch']> {
    return this.client
      .request<InitializeEmptyBatchResponse, InitializeEmptyBatchPayload>(INITIALIZE_EMPTY_BATCH, {
        importedFromUrl: location.href,
      })
      .then(({ initializeEmptyBatch }) => {
        emit('init', initializeEmptyBatch)
        return initializeEmptyBatch
      })
      .catch((error: ClientError) => this.handleError(error.response.errors, error.message))
  }

  async getFinalDatabaseView(
    batchId: string,
    limit = 1000
  ): Promise<GetFinalDatabaseViewResponse['getFinalDatabaseView']> {
    return this.client
      .request<GetFinalDatabaseViewResponse, GetFinalDatabaseViewPayload>(GET_FINAL_DATABASE_VIEW, {
        batchId,
        limit,
      })
      .then(({ getFinalDatabaseView }) => getFinalDatabaseView)
      .catch((error: ClientError) => this.handleError(error.response.errors, error.message))
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
