import { gql } from 'graphql-request'

export interface GetFinalDatabaseViewResponse__rows {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, string | number | boolean | Record<string, any>>
  info: {
    level: 'error' | 'warn' | 'info' | ''
    key: string
    message: string
  }[]
}

export interface GetFinalDatabaseViewResponse {
  getFinalDatabaseView: {
    rows: GetFinalDatabaseViewResponse__rows[]
  }
}

export interface GetFinalDatabaseViewPayload {
  batchId: string
  limit: number
  skip?: number
}

export const GET_FINAL_DATABASE_VIEW = gql`
  query GetFinalDatabaseView($skip: Int, $batchId: UUID, $limit: Int!) {
    getFinalDatabaseView(skip: $skip, limit: $limit, batchId: $batchId) {
      rows
    }
  }
`
