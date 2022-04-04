import { FlatfileError } from './FlatfileError'

export class ImplementationError extends FlatfileError {
  public code = 'FF-IE-00'
  public name = 'ImplementationError'
  public userMessage = 'No token or onAuth callback was provided.'
  public debug = 'No token or onAuth callback was provided.'
}
