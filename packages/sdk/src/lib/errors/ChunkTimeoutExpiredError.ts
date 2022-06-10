import { FlatfileError } from './FlatfileError'

export class ChunkTimeoutExpiredError extends FlatfileError {
  public override code = 'FF-CT-01'
  public override name = 'ChunkTimeoutExpiredError'
  public override userMessage = 'Something went wrong while submitting your data.'
  public override debug =
    'Chunk processing callback (onData) is calling next() after the timeout limit. Increase the timeout limit or reduce chunkSize.'
}
