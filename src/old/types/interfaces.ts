import { GetFinalDatabaseViewResponse } from '../graphql/queries/GET_FINAL_DATABASE_VIEW'

/**
 * @deprecated See flatfile.com/docs/embedding-flatfile/upgrading/
 */
export interface IFlatfileImporter {
  __unsafeGenerateToken(o: IUnsafeGenerateTokenOptions): Promise<void>
  launch(): Promise<{ batchId: string }>
  on<K extends keyof IEvents>(event: K, cb: (e: IEvents[K]) => void): void
  close(): void
}

/**
 * @deprecated See flatfile.com/docs/embedding-flatfile/upgrading/
 */
export interface IFlatfileImporterConfig {
  mountUrl?: string
  apiUrl?: string
}

/**
 * @deprecated See flatfile.com/docs/embedding-flatfile/upgrading/
 */
export interface IUnsafeGenerateTokenOptions {
  endUserEmail: string
  privateKey: string
  embedId: string
}

/**
 * @deprecated See flatfile.com/docs/embedding-flatfile/upgrading/
 */
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
