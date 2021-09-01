import { IEvents } from '../importer/eventManager';

export interface IFlatfileImporter {
  __unsafeGenerateToken(o: IUnsafeGenerateTokenOptions): Promise<void>
  launch(): Promise<{ batchId: string }>
  on<K extends keyof IEvents>(event: K, cb: (e: IEvents[K]) => void): void
  close(): void
}

export interface IUnsafeGenerateTokenOptions {
  endUserEmail: string
  privateKey: string
  embedId: string
}