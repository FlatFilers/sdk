import { GetFinalDatabaseViewResponse } from './graphql/queries/GET_FINAL_DATABASE_VIEW'

export interface IFlatfileImporter {
  __unsafeGenerateToken(o: IUnsafeGenerateTokenOptions): Promise<void>
  launch(): Promise<{ batchId: string }>
  on<K extends keyof IEvents>(event: K, cb: (e: IEvents[K]) => void): void
  close(): void
}

export interface IFlatfileImporterConfig {
  mountUrl?: string
  apiUrl?: string
}

export interface IFlatfileConfig {
  mountUrl: string
  apiUrl: string
}

export interface IUnsafeGenerateTokenOptions {
  endUserEmail: string
  privateKey: string
  embedId: string
}

export interface IEvents {
  init: {
    batchId: string
    schemas: {
      id: string
    }[]
    workspaceId: string
  }
  upload: {
    uploadId: string
  }
  error: {
    error: Error
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
  env?: Record<string, any>
}

export type JsonWebToken = string
