import { gql } from 'graphql-request'

export interface BatchStatusUpdatedResponse {
  id: string
  status: string
}

export const BATCH_STATUS_UPDATED = gql`
  subscription BatchStatusUpdated($batchId: UUID!) {
    batchStatusUpdated(batchId: $batchId) {
      id
      status
    }
  }
`
