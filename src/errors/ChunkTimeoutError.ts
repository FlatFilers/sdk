import { FlatfileError } from './FlatfileError'

export class ChunkTimeoutError extends FlatfileError {
  public code = 'FF-CT-01'
  public name = 'ChunkTimeoutError'
  public userMessage = 'Chunk processing timeout'
  public debug =
    'Chunk processing callback is taking more than expected. Did you forget to call next inside your onData callback?'
}
