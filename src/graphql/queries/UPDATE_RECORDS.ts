import { gql } from 'graphql-request'

export const UPDATE_RECORDS = gql`
  mutation UpdateWorkbookRows($edits: [JSON!]!, $batchId: UUID) {
    updateWorkbookRows(edits: $edits, batchId: $batchId) {
      rows {
        _id
        cells
        validations {
          error
          key
          message
        }
      }
    }
  }
`
