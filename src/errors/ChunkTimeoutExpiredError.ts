import { FlatfileError } from './FlatfileError'

export class ChunkTimeoutExpiredError extends FlatfileError {
  public code = 'FF-CT-01'
  public name = 'ChunkTimeoutExpiredError'
  public userMessage = 'Something went wrong while submitting your data.'
  public debug =
    'Chunk processing callback (onData) is calling next() after the timeout limit. Increase the timeout limit or reduce chunkSize.'
}
