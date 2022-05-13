import { FlatfileError } from './FlatfileError'

export class ChunkTimeoutExpiredError extends FlatfileError {
  public code = 'FF-CT-00'
  public name = 'ChunkTimeoutExpiredError'
  public userMessage = 'Chunk processing time expired'
  public debug = 'Chunk processing callback (onData) is finishing after expected time.'
}
