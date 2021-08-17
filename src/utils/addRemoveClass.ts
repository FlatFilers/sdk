/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const addClass = (el: HTMLElement, className: string) => {
  if (el.className === '') return (el.className = className)
  const classes = el.className.split(' ')
  if (classes.indexOf(className) > -1) return
  classes.push(className)
  el.className = classes.join(' ')
}

export const removeClass = (el: HTMLElement, className: string): string | undefined => {
  if (el.className === '') return
  const classes = el.className.split(' ')
  const idx = classes.indexOf(className)
  if (idx > -1) classes.splice(idx, 1)
  el.className = classes.join(' ')
}
