import { FlatfileRecords, FlatfileSession } from '@flatfile/hooks/dist/src'
import { serializeFn } from 'transferable-function'

export function serializeHook(
  fn: (payload: FlatfileRecords, session: FlatfileSession) => void
): string {
  return JSON.stringify(serializeFn(fn))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeFunction(fn: (...args: any[]) => any): string {
  return JSON.stringify(serializeFn(fn))
}
