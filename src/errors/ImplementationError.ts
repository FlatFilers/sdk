import { FlatfileError } from './FlatfileError'

export class ImplementationError extends FlatfileError {
  public code = 'FF-IE-00'
  public name = 'ImplementationError'
  public debug = '`embedId` or `token` property is required to initialize Flatfile.'
  public userMessage = 'There was a configuration error preventing the data importer from loading.'
}
