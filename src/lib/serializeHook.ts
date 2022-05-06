import { serializeFn } from 'transferable-function'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeHook(fn: (payload: any, session: any) => void): string {
  return JSON.stringify(serializeFn(fn))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeFunction(fn: (...args: any[]) => any): string {
  return JSON.stringify(serializeFn(fn))
}
