import { useOrInit } from './general'

describe('useOrInit', () => {
  test('current set value is preferred', () => {
    let stub = 1
    expect(useOrInit(stub, () => (stub = 2))).toBe(1)
  })
  test('new value is set and returned when undefined', () => {
    let stub
    expect(useOrInit(stub, () => (stub = 2))).toBe(2)
    expect(stub).toBe(2)
  })
  test('falsy value 0 is treated as real', () => {
    let stub = 0
    expect(useOrInit(stub, () => (stub = 2))).toBe(0)
  })
  test('falsy value null is treated as real', () => {
    let stub: number | null = null
    expect(useOrInit(stub, () => (stub = 2))).toBe(null)
  })
  test('falsy value boolean is treated as real', () => {
    let stub = false
    expect(useOrInit(stub, () => (stub = true))).toBe(false)
  })
})
