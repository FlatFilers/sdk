/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { EventEmitter } from 'eventemitter3'

import { IEvents } from '../types/interfaces'

export const eventManager = new EventEmitter()

type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never
}
type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base]
type Diff<T, U> = T extends U ? never : T

export function emit<
  K extends Diff<keyof IEvents, AllowedNames<IEvents, undefined>>,
  Attr extends IEvents[K]
>(event: K, payload?: Attr | undefined) {
  eventManager.emit(event, payload)
}

export function listen<K extends keyof IEvents>(event: K, cb: (e: IEvents[K]) => void) {
  eventManager.on(event, cb)
  return () => {
    eventManager.off(event, cb)
  }
}

export const cleanup = () => {
  eventManager.removeAllListeners()
}
