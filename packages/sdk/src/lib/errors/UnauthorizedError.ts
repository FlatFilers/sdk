import { FlatfileError } from './FlatfileError'

export class UnauthorizedError extends FlatfileError {
  public override code = 'FF-UA-00'
  public override name = 'UnauthorizedError'
  public override debug =
    'The JWT was not signed with a recognized private key or you did not provide the ' +
    'necessary information to identify the end user'
  public override userMessage = 'There was an issue establishing a secure import session.'
}
