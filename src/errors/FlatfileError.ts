export class FlatfileError extends Error {
  public code = 'FF00'
  public debug = ''
  public userMessage = 'An unknown issue has occured'
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
