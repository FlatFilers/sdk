import { EventEmitter } from 'eventemitter3'

import { IEvents } from '../types'

export const eventManager = new EventEmitter()

export class TypedEventManager<T> {
  private em: any
  private proxies: TypedEventManager<T>[] = []
  constructor() {
    this.em = new EventEmitter()
  }

  public emit<K extends Diff<keyof T, AllowedNames<IEvents, undefined>>, Attr extends T[K]>(
    event: K,
    payload?: Attr | undefined
  ): void {
    this.em.emit(event, payload)
    this.proxies.forEach((p) => {
      p.emit(event, payload)
    })
  }

  public listen<K extends keyof T>(event: K, cb: (e: T[K]) => void): () => void {
    this.on(event, cb)
    return () => {
      this.off(event, cb)
    }
  }

  public on<K extends keyof T>(event: K, cb: (e: T[K]) => void): void {
    this.em.on(event, cb)
  }

  public off<K extends keyof T>(event: K, cb: (e: T[K]) => void): void {
    this.em.off(event, cb)
  }

  public cleanup(): void {
    this.em.removeAllListeners()
  }

  public proxyTo(em1: TypedEventManager<T>): void {
    this.proxies.push(em1)
  }
}

type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never
}
type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base]
type Diff<T, U> = T extends U ? never : T
