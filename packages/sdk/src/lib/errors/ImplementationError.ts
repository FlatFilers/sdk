import { FlatfileError } from './FlatfileError'

export class ImplementationError extends FlatfileError {
  public override code = 'FF-IE-00'
  public override name = 'ImplementationError'
  public override userMessage = 'No token or onAuth callback was provided.'
  public override debug = 'No token or onAuth callback was provided.'
}
