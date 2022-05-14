import { FlatfileError } from './FlatfileError'

export class ChunkTimeoutError extends FlatfileError {
  public code = 'FF-CT-00'
  public name = 'ChunkTimeoutError'
  public userMessage = 'Something went wrong while submitting your data.'
  public debug =
    'Chunk processing callback is taking longer than expected. Did you forget to call next() inside your onData callback?'
}
