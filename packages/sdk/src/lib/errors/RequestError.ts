import { FlatfileError } from './FlatfileError'

export class RequestError extends FlatfileError {
  public override code = 'FF-RE-00'
  public override debug = ''
  public override userMessage = 'A network request failed to complete. Please try again.'
  public override name = 'RequestError'
}
