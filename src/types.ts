import { FlatfileError } from './errors/FlatfileError'
import { GetFinalDatabaseViewResponse } from './graphql/queries/GET_FINAL_DATABASE_VIEW'

export interface IFlatfileImporterConfig {
  mountUrl?: string
  apiUrl?: string
  token?: JsonWebToken
  onAuth?: () => Promise<JsonWebToken>
}

export interface IFlatfileConfig {
  mountUrl: string
  apiUrl: string
  token?: JsonWebToken
  onAuth?: () => Promise<JsonWebToken>
}

export interface IEvents {
  init: {
    batchId: string
    schemas: {
      id: number
    }[]
    workspaceId: string
  }
  upload: {
    uploadId: string
  }
  error: {
    error: FlatfileError
  }
  launch: {
    batchId: string
  }
  complete: {
    batchId: string
    data: (sample?: boolean) => Promise<GetFinalDatabaseViewResponse['getFinalDatabaseView']>
  }
  close: void
}

export interface IUser {
  id: string | number
  email: string
  name: string
}

export interface IOrganization {
  id: string | number
  name: string
}

export interface IRawToken {
  user?: IUser
  org?: IOrganization
  env?: Record<string, unknown>
}

export type JsonWebToken = string
