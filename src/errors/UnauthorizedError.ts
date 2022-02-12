import { FlatfileError } from './FlatfileError'

export class UnauthorizedError extends FlatfileError {
  public code = 'FF-UA-00'
  public debug =
    'The JWT was not signed with a recognized private key or you did not provide the ' +
    'necessary information to identify the end user'
  public userMessage = 'There was an issue establishing a secure import session.'
}
