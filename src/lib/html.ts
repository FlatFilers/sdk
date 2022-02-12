/**
 * Cross browser compatible utility for adding classes to a DOM element
 * @param el
 * @param className
 */
export const addClass = (el: HTMLElement, className: string): void => {
  if (el.className === '') {
    el.className = className
    return
  }
  const classes = el.className.split(' ')
  if (classes.indexOf(className) > -1) return
  classes.push(className)
  el.className = classes.join(' ')
}

/**
 * Cross browser compatible utility for removing classes from a DOM element
 * @param el
 * @param className
 */
export const removeClass = (el: HTMLElement, className: string): void => {
  const classes = el.className.split(' ')
  const idx = classes.indexOf(className)
  /* istanbul ignore else */
  if (idx > -1) {
    classes.splice(idx, 1)
  }
  el.className = classes.join(' ')
}

/**
 * Simple typestrong wrapper for document.querySelector
 * @param query
 */
export function $<T extends HTMLElement = HTMLElement>(query: string): T {
  return document.querySelector(query) as T
}
