import { gql } from 'graphql-request'

export const QUEUE_UPDATE_RECORD_STATUS = gql`
  mutation queueUpdateRecordStatus(
    $filter: JSON
    $rowIds: [Int!]
    $validationState: String!
    $workbookId: String!
    $schemaId: Int!
  ) {
    queueUpdateRecordStatus(
      filter: $filter
      rowIds: $rowIds
      validationState: $validationState
      workbookId: $workbookId
      schemaId: $schemaId
    ) {
      id
    }
  }
`
