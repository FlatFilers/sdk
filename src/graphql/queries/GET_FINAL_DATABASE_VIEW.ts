import { gql } from 'graphql-request'

import { ELevel, ERecordStatus, TRecordData } from '../../service/FlatfileRecord'

export interface IRowResponse {
  id: number
  valid: boolean
  status: ERecordStatus
  data: TRecordData
  info: {
    level: ELevel
    key: string
    message: string
  }[]
}

export interface GetFinalDatabaseViewResponse {
  getFinalDatabaseView: {
    rows: IRowResponse[]
    totalRows: number
  }
}

export interface GetFinalDatabaseViewPayload {
  batchId: string
  limit: number
  skip: number
  status?: ERecordStatus
}

export const GET_FINAL_DATABASE_VIEW = gql`
  query GetFinalDatabaseView($skip: Int, $batchId: UUID, $limit: Int!, $status: String) {
    getFinalDatabaseView(skip: $skip, limit: $limit, batchId: $batchId, status: $status) {
      rows
      totalRows
    }
  }
`
