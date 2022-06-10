import { FlatfileError } from './FlatfileError'

export class ChunkTimeoutError extends FlatfileError {
  public override code = 'FF-CT-00'
  public override name = 'ChunkTimeoutError'
  public override userMessage = 'Something went wrong while submitting your data.'
  public override debug =
    'Chunk processing callback is taking longer than expected. Did you forget to call next() inside your onData callback?'
}
