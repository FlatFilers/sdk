import { IImportMeta, IImportSessionEvents, ImportSession } from './importer/ImportSession'
import { IteratorCallback } from './lib/RecordChunkIterator'

import { FlatfileError } from './errors/FlatfileError'
import { GetFinalDatabaseViewResponse } from './graphql/queries/GET_FINAL_DATABASE_VIEW'

export interface IFlatfileImporterConfig {
  mountUrl?: string
  apiUrl?: string
  token?: JsonWebToken
  embedId?: string
  user?: IUser
  org?: IOrganization
  onAuth?: () => JsonWebToken | Promise<JsonWebToken>
}

export interface IFlatfileConfig {
  mountUrl: string
  apiUrl: string
  token?: JsonWebToken
  embedId?: string
  user?: IUser
  org?: IOrganization
  onAuth?: () => JsonWebToken | Promise<JsonWebToken>
}

export interface IImportSessionConfig {
  onInit?: (payload: IImportSessionEvents['init']) => void | Promise<void>
  onData?: IteratorCallback
  onComplete?: (payload: IImportSessionEvents['complete']) => void | Promise<void>
  onError?: (payload: { error: Error }) => void | Promise<void>
}

export interface IEvents {
  init: {
    session: ImportSession
    meta: IImportMeta
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