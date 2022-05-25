import { FlatfileError } from './FlatfileError'

export class UnauthorizedError extends FlatfileError {
  public code = 'FF-UA-00'
  public name = 'UnauthorizedError'
  public debug =
    'The JWT was not signed with a recognized private key or you did not provide the ' +
    'necessary information to identify the end user'
  public userMessage = 'There was an issue establishing a secure import session.'

  constructor(debug?: string, code?: string) {
    super(debug)
    if (debug) {
      this.debug = debug
    }
    this.code = code ?? 'FF-UA-00'
  }
}
