import { IEvents } from '../types'

type IResponse = IEvents['complete'] | void
export type IResponsePromise = Promise<IResponse>

export class ResponsePromise {
  private $resolve?: (val: IResponse) => void
  private $reject?: (err: Error) => void

  promise: IResponsePromise

  constructor() {
    this.promise = new Promise<IResponse>((resolve, reject) => {
      this.$resolve = resolve
      this.$reject = reject
    })
  }

  public resolve(val: IResponse): void {
    this.$resolve?.(val)
  }

  public reject(err: Error): void {
    this.$reject?.(err)
  }
}
