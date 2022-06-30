import { IImportMeta, IImportSessionEvents, ImportSession } from 'importer/ImportSession'
import { IteratorCallback } from 'lib/RecordChunkIterator'

import { FlatfileError } from './errors/FlatfileError'
import { GetFinalDatabaseViewResponse } from './graphql/queries/GET_FINAL_DATABASE_VIEW'

export type PartiallyOptional<Type, OptionalKey extends keyof Type> = Pick<Type, OptionalKey> &
  Partial<Omit<Type, OptionalKey>>

export interface IFlatfileImporterConfig {
  mountUrl?: string
  apiUrl?: string
  token?: JsonWebToken | (() => JsonWebToken | Promise<JsonWebToken>)
  embedId?: string
  user?: PartiallyOptional<IUser, 'id'>
  org?: PartiallyOptional<IOrganization, 'id'>
  onError?: (payload: { error: FlatfileError }) => void | Promise<void>
}

export interface IFlatfileConfig extends IFlatfileImporterConfig {
  mountUrl: string
  apiUrl: string
}

export interface IImportSessionConfig {
  onInit?: (payload: IImportSessionEvents['init']) => void | Promise<void>
  onData?: IteratorCallback
  onComplete?: (payload: IImportSessionEvents['complete']) => void | Promise<void>
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
  user?: PartiallyOptional<IUser, 'id'>
  org?: PartiallyOptional<IOrganization, 'id'>
  env?: Record<string, unknown>
}

export type JsonWebToken = string
