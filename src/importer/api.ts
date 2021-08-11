import axios from 'axios'
import { gql, GraphQLClient } from 'graphql-request'
import { SubscriptionClient } from 'graphql-subscriptions-client'

import { IConfig } from './config'
import { emit } from './eventManager'

const getSignedUrlHeaders = (signedUrl: string) => {
  const headers: Record<string, string> = {}
  // https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html
  const allowedHeaders = [
    'x-amz-acl',
    'Cache-Control',
    'Content-Disposition',
    'Content-Encoding',
    'Content-Language',
    'Content-Length',
    'Content-MD5',
    'Content-Type',
    'Expires',
    'x-amz-grant-full-control',
    'x-amz-grant-read',
    'x-amz-grant-read-acp',
    'x-amz-grant-write-acp',
    'x-amz-server-side-encryption',
    'x-amz-storage-class',
    'x-amz-website-redirect-location',
    'x-amz-server-side-encryption-customer-algorithm',
    'x-amz-server-side-encryption-customer-key',
    'x-amz-server-side-encryption-customer-key-MD5',
    'x-amz-server-side-encryption-aws-kms-key-id',
    'x-amz-server-side-encryption-context',
    'x-amz-request-payer',
    'x-amz-tagging',
    'x-amz-object-lock-mode',
    'x-amz-object-lock-retain-until-date',
    'x-amz-object-lock-legal-hold',
    'x-amz-expected-bucket-owner',
  ]
  const parsedSignedURL = new URL(signedUrl)
  parsedSignedURL.searchParams.forEach((value, key) => {
    if (allowedHeaders.indexOf(key) > -1 || key.indexOf('x-amz-meta-') > -1) {
      headers[key] = value
    }
  })
  return headers
}

interface IInitializeAndUploadResponse {
  initializeBatchAndUpload: {
    batch: {
      id: string
    }
    signedUrl: string
    upload: {
      id: string
    }
  }
}

interface IUpdateUploadStatusResponse {
  updateUploadStatus: {
    view: {
      id: string
    }
    upload: {
      id: string
    }
  }
}

export class ApiService {
  private client: GraphQLClient
  private pubsub: SubscriptionClient

  constructor(private token: string, private config: IConfig) {
    this.client = new GraphQLClient(`${config.apiUrl}/graphql`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })
    this.pubsub = new SubscriptionClient(`${config.ws}/graphql`, {
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
  private handleError(error: Error): any {
    // TODO: pretty handle error
    throw new Error(error.message)
  }

  async init(): Promise<{
    batchId: string
    schemas: { id: string }[]
    workspaceId: string
  }> {
    const query = gql`
      mutation InitializeEmptyBatch($importedFromUrl: String!) {
        initializeEmptyBatch(importedFromUrl: $importedFromUrl) {
          batchId
          workspaceId
          schemas {
            id
          }
        }
      }
    `

    return this.client
      .request(query, {
        importedFromUrl: location.href,
      })
      .then(({ initializeEmptyBatch }) => {
        emit('init', initializeEmptyBatch)
        return initializeEmptyBatch
      })
      .catch((error) => this.handleError(error))
  }

  subscribeBatchStatusEvents(batchId: string): any {
    const query = gql`
      subscription BatchStatusUpdated($batchId: UUID!) {
        batchStatusUpdated(batchId: $batchId) {
          id
          status
        }
      }
    `
    return this.pubsub.request({
      query,
      variables: {
        batchId,
      },
    })
  }

  // TODO: if upload takes too long, browser will block `window.open`
  async upload(
    workspaceId: string,
    batchId: string,
    schemaId: string,
    file: File
  ): Promise<{ uploadId: string; viewId: string }> {
    const query = gql`
      mutation InitializeBatchAndUpload(
        $schemaId: ID
        $fileType: String!
        $fileSize: Int!
        $fileName: String!
        $workspaceId: UUID
        $batchId: UUID
      ) {
        initializeBatchAndUpload(
          schemaId: $schemaId
          fileType: $fileType
          fileSize: $fileSize
          fileName: $fileName
          workspaceId: $workspaceId
          batchId: $batchId
        ) {
          signedUrl
          batch {
            id
          }
          upload {
            id
          }
        }
      }
    `
    const { uploadId, signedUrl } = await this.client
      .request<IInitializeAndUploadResponse>(query, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        schemaId,
        workspaceId,
        batchId,
      })
      .then(({ initializeBatchAndUpload }) => ({
        uploadId: initializeBatchAndUpload.upload.id,
        signedUrl: initializeBatchAndUpload.signedUrl,
      }))
      .catch((error) => this.handleError(error))

    try {
      await axios({
        method: 'PUT',
        headers: getSignedUrlHeaders(signedUrl),
        data: file,
        url: signedUrl,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log({ percentCompleted })
        },
      })
    } catch (e) {
      throw new Error(`Error uploading file data: ${e.message}`)
    }

    const viewId = await this.updateUploadStatus(uploadId)

    emit('upload', {
      uploadId,
      viewId,
    })

    return {
      uploadId,
      viewId,
    }
  }

  private async updateUploadStatus(uploadId: string): Promise<string> {
    const query = gql`
      mutation UpdateUploadStatus($uploadId: String!, $status: String!) {
        updateUploadStatus(uploadId: $uploadId, status: $status) {
          upload {
            id
            status
          }
          view {
            id
            status
          }
        }
      }
    `

    const { viewId } = await this.client
      .request<IUpdateUploadStatusResponse>(query, {
        uploadId,
        status: 'uploaded',
      })
      .then(({ updateUploadStatus }) => {
        emit('upload', { uploadId: updateUploadStatus.upload.id })
        return {
          viewId: updateUploadStatus.view.id,
        }
      })
      .catch((error) => this.handleError(error))

    return viewId
  }

  async getData(batchId: string, limit = 1000): Promise<any> {
    const query = gql`
      query GetFinalDatabaseView($skip: Int, $batchId: UUID, $limit: Int!) {
        getFinalDatabaseView(skip: $skip, limit: $limit, batchId: $batchId) {
          validData
          invalidData
        }
      }
    `
    return this.client
      .request(query, { batchId, limit })
      .then(({ getFinalDatabaseView }) => getFinalDatabaseView)
      .catch((error) => this.handleError(error))
  }
}
