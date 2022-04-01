/**
 * Use a previously defined value or call an optional initializer
 * @param current
 * @param setter
 */
export function useOrInit<T>(current: T | undefined, setter: () => T): T {
  if (current !== undefined) {
    return current
  } else {
    return setter()
  }
}

/**
 * Convert an object to a query string
 * @param obj
 */
export function toQs(obj: Record<string, string>): string {
  return Object.keys(obj)
    .map((k) => `${k}=${encodeURI(obj[k])}`)
    .join('&')
}
