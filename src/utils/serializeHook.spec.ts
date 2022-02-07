import { deserializeFn } from 'transferable-function'

import { serializeFunction, serializeHook } from './serializeHook'

describe('serializeHook', () => {
  test('serializes a basic hook', () => {
    const serialized = serializeHook((payload) => {
      payload.mapRecords(function (record) {
        return new Promise(function (resolve) {
          record.set('foo', 'bar')
          resolve()
        })
      })
    })
    expect(serialized).toContain(`record.set('foo', 'bar')`)
    expect(typeof serialized).toBe('string')
  })
  test.todo('unserialized hook can execute inside a hook context')
})

describe('serializeFunction', () => {
  test('serializes a basic function', () => {
    const serialized = serializeFunction((a: number, b: number) => {
      return a + b
    })
    expect(serialized).toContain(`return a + b`)
    expect(typeof serialized).toBe('string')
  })
  test('unserialized function can execute', () => {
    const serialized = serializeFunction((a: number, b: number) => {
      return a + b
    })
    const parsed = JSON.parse(serialized)
    expect(deserializeFn(parsed)(1, 2)).toBe(3)
  })
})
