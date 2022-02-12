export class FlatfileError extends Error {
  public code = 'FF-GE-00'
  public debug = ''
  public userMessage = 'An unknown issue has occured'
  constructor(message?: string) {
    super(message)
    if (!this.message && this.userMessage) {
      this.message = this.userMessage
    }
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
