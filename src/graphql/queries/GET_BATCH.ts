import { gql } from 'graphql-request'

export const GET_BATCH = gql`
  query GetBatch($batchId: UUID!) {
    getBatch(batchId: $batchId) {
      id
      status
    }
  }
`
