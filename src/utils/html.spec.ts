import { $, addClass, removeClass } from './html'

describe('addClass', () => {
  test('adds class to element', () => {
    const el = document.createElement('div')
    addClass(el, 'foo')
    expect(el.className).toBe('foo')
  })
  test('does not add more than one of the same class to element', () => {
    const el = document.createElement('div')
    addClass(el, 'foo')
    addClass(el, 'foo')
    expect(el.classList.length).toBe(1)
  })
  test('adds more than one class to element', () => {
    const el = document.createElement('div')
    addClass(el, 'foo')
    addClass(el, 'bar')
    expect(el.classList).toContain('foo')
    expect(el.classList).toContain('bar')
  })
})

describe('removeClass', () => {
  test('removes class to element', () => {
    const el = document.createElement('div')
    el.classList.add('foo')
    removeClass(el, 'foo')
    expect(el.classList).not.toContain('foo')
  })
  test('removes only one class when multiple', () => {
    const el = document.createElement('div')
    el.classList.add('foo', 'bar')
    removeClass(el, 'bar')
    expect(el.classList).toContain('foo')
    expect(el.classList).not.toContain('bar')
  })
})

describe('$', () => {
  test('finds by className', () => {
    const el = document.createElement('div')
    el.className = 'findme'
    el.setAttribute('data-found', 'yes')
    document.querySelector('body')?.appendChild(el)
    const found = $('.findme')
    expect(found.outerHTML).toEqual('<div class="findme" data-found="yes"></div>')
  })
})
