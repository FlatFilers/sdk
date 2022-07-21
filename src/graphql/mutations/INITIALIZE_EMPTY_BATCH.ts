import { gql } from 'graphql-request'

export interface InitializeEmptyBatchResponse {
  initializeEmptyBatch: {
    batchId: string
    schemas: { id: string }[]
    workspaceId: string
  }
}

export interface InitializeEmptyBatchPayload {
  importedFromUrl: string
  synced?: boolean
}

export const INITIALIZE_EMPTY_BATCH = gql`
  mutation InitializeEmptyBatch($importedFromUrl: String!, $synced: Boolean) {
    initializeEmptyBatch(importedFromUrl: $importedFromUrl, synced: $synced) {
      batchId
      workspaceId
      schemas {
        id
      }
    }
  }
`
