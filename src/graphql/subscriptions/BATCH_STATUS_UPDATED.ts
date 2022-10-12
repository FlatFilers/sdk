import { gql } from 'graphql-request'

export interface IBatch {
  id: string
  status: string
}

export interface BatchStatusUpdatedResponse {
  batchStatusUpdated: IBatch
}

export const BATCH_STATUS_UPDATED = gql`
  subscription BatchStatusUpdated($batchId: UUID!) {
    batchStatusUpdated(batchId: $batchId) {
      id
      status
    }
  }
`
