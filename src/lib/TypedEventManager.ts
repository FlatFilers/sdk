import { EventEmitter } from 'eventemitter3'

import { IEvents } from '../types'

export const eventManager = new EventEmitter()

export class TypedEventManager<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private em: any
  private proxies: TypedEventManager<T>[] = []
  constructor() {
    this.em = new EventEmitter()
  }

  public emit<K extends Diff<keyof T, AllowedNames<IEvents, undefined>>, Attr extends T[K]>(
    event: K,
    payload?: Attr | undefined
  ): this {
    this.em.emit(event, payload)
    this.proxies.forEach((p) => {
      p.emit(event, payload)
    })
    return this
  }

  public hasListener<K extends keyof T>(event: K): boolean {
    return this.em.listenerCount(event) > 0
  }

  public listen<K extends keyof T>(event: K, cb: (e: T[K]) => void): () => this {
    this.on(event, cb)
    return () => {
      this.off(event, cb)
      return this
    }
  }

  public on<K extends keyof T>(event: K, cb: (e: T[K]) => void | Promise<void>): this {
    this.em.on(event, cb)
    return this
  }

  public off<K extends keyof T>(event: K, cb: (e: T[K]) => void): this {
    this.em.off(event, cb)
    return this
  }

  public cleanup(): this {
    this.em.removeAllListeners()
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public proxyTo(em1: TypedEventManager<any>): this {
    this.proxies.push(em1)
    return this
  }

  /**
   * Forwards all the events of a given type to another event emitter
   *
   * @param eventName The event type to be forwarded
   * @param em The event emitter the events will be forwarded to
   */
  public bubble<K extends keyof T>(eventName: K, em: TypedEventManager<Record<K, T[K]>>): void {
    this.on(eventName, (payload) => {
      em.emit(eventName, payload)
    })
  }
}

type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never
}
type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base]
type Diff<T, U> = T extends U ? never : T
