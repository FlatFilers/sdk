import { gql } from 'graphql-request'

export const PREFLIGHT_BATCH = gql`
  mutation PreflightBatch($batchId: String!) {
    preflightBatch(batchId: $batchId) {
      schemas {
        id
      }
      workbookId
      workspaceId
    }
  }
`
