export class FlatfileError extends Error {
  public code = 'FF-GE-00'
  public debug = ''
  public name = 'FlatfileError'
  public userMessage = 'An unknown issue has occured'
  constructor(message?: string) {
    super(message)
    const self = new.target.prototype
    Object.setPrototypeOf(this, self)

    // this isn't working the way I'd expect
    if (!this.message && self.userMessage) {
      this.message = self.userMessage
    }
    if (!self.message && self.userMessage) {
      self.message = self.userMessage
    }

    if (!self.debug) {
      self.debug = self.message
    }
  }
}
