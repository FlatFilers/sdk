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
