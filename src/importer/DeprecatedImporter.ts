import { Flatfile } from '../Flatfile'
import { TypedEventManager } from '../lib/TypedEventManager'
import { IEvents } from '../types'
import { ImportSession } from './ImportSession'

export class DeprecatedImporter extends TypedEventManager<IEvents> {
  /**
   * Reference to instance of initialized importer
   * @private
   */
  private importer?: ImportSession

  constructor(public ff: Flatfile) {
    super()
  }

  /**
   * @deprecated use Flatfile.initializeFromRawToken instead
   * @param payload
   */
  async __unsafeGenerateToken(payload: {
    embedId: string
    endUserEmail: string
    privateKey: string
  }): Promise<void> {
    const { embedId, endUserEmail, privateKey } = payload
    if (this.importer) {
      throw new Error('You cannot call __unsafeGenerateToken after already opening the importer')
    }
    console.warn(
      '[Flatfile SDK]: Using `.__unsafeGenerateToken()` is unsafe and would expose your private key.'
    )
    const token = await Flatfile.getDevelopmentToken(
      embedId,
      {
        user: { id: endUserEmail, email: endUserEmail, name: 'Unknown' },
        org: { id: endUserEmail, name: 'Unknown' },
        env: {
          test: 'foo',
        },
      },
      privateKey
    )
    this.ff = new Flatfile({ ...this.ff.config, token })
  }

  /**
   * @deprecated use flatfile.startOrResumeImport({open: 'iframe'})
   */
  async launch(mode: 'iframe' | 'window' = 'iframe'): Promise<{ batchId: string }> {
    try {
      const importer = await this.ff.startOrResumeImportSession({ open: mode })
      importer.proxyTo(this)
      this.importer = importer
      return {
        batchId: importer.batchId,
      }
    } catch (e) {
      throw e
    }
  }

  /**
   * @deprecated use importer.iframe.close()
   */
  close(): void {
    this.importer?.iframe.close()
  }
}
