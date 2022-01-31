import { Flatfile } from '../Flatfile'
import { IFlatfileImporter, IFlatfileImporterConfig } from '../types'
import { DeprecatedImporter } from './DeprecatedImporter'

/**
 * @deprecated use new Flatfile(token, config) instead
 * @param token
 * @param config
 */
export function flatfileImporter(
  token: string,
  config: IFlatfileImporterConfig = {}
): DeprecatedImporter {
  const ff = new Flatfile(token, config)
  return new DeprecatedImporter(ff)
}
