import { FlatfileError } from './FlatfileError'

export class RequestError extends FlatfileError {
  public code = 'FF-RE-00'
  public debug = ''
  public userMessage = 'A network request failed to complete. Please try again.'
  public name = 'RequestError'
}
