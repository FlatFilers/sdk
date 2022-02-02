import { FlatfileError } from './FlatfileError'

export class RequestError extends FlatfileError {
  public code = 'FF01'
  public debug = ''
  public userMessage = 'A network request failed to complete. Please try again.'
}
