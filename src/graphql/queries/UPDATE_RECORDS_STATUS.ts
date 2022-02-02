import { gql } from 'graphql-request'

export const UPDATE_RECORD_STATUS = gql`
  mutation UpdateRecordStatus(
    $workbookId: String!
    $schemaId: Int!
    $validationState: String!
    $rowIds: [Int!]
  ) {
    queueUpdateRecordStatus(
      workbookId: $workbookId
      schemaId: $schemaId
      validationState: $validationState
      rowIds: $rowIds
    ) {
      id
    }
  }
`
