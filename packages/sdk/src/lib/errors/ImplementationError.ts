import { FlatfileError } from './FlatfileError'

export class ImplementationError extends FlatfileError {
  public override code = 'FF-IE-00'
  public override name = 'ImplementationError'
  public override debug = '`embedId` or `token` property is required to initialize Flatfile.'
  public override userMessage = 'There was a configuration error preventing the data importer from loading.'
}
