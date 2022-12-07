import { toQs, useOrInit } from './general'

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

describe('toQS', () => {
  test('returns an encoded url string', () => {
    const obj = { customFields: JSON.stringify([{ field: 'test#22' }, { field: 'name' }]) }

    expect(toQs(obj).includes('#')).toBe(false)
    expect(toQs(obj)).toBe(
      'customFields=%5B%7B%22field%22%3A%22test%2322%22%7D%2C%7B%22field%22%3A%22name%22%7D%5D'
    )
  })
})
