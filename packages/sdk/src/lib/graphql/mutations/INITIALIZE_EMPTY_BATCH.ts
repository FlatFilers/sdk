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
}

export const INITIALIZE_EMPTY_BATCH = gql`
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
