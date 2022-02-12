import { ApiService } from './graphql/ApiService'
import { ImportSession } from './importer/ImportSession'
import { sign } from './lib/jwt'
import { TypedEventManager } from './lib/TypedEventManager'
import { IEvents, IFlatfileConfig, IFlatfileImporterConfig, IRawToken, JsonWebToken } from './types'

export class Flatfile extends TypedEventManager<IEvents> {
  /**
   * Reference to a pre-authenticated instance of the API service
   */
  public readonly api: ApiService

  /**
   * The configuration of this instance of Flatfile with defaults merged in
   */
  public readonly config: IFlatfileConfig

  /**
   * JWT for securing user data while interacting with Flatfile
   */
  public readonly token: JsonWebToken

  constructor(token: JsonWebToken, config: IFlatfileImporterConfig = {}) {
    super()

    this.config = this.mergeConfigDefaults(config)
    this.token = token
    this.api = new ApiService(token, this.config.apiUrl)
  }

  /**
   * Start a new import or resume the one that's currently in progress
   */
  public async startOrResumeImportSession(options?: {
    open?: 'iframe' | 'window'
  }): Promise<ImportSession> {
    try {
      const importMeta = await this.api.init()

      this.emit('launch', { batchId: importMeta.batchId }) // todo - should this happen here
      const session = new ImportSession(this, importMeta)
      session.emit('init', importMeta)
      if (options?.open === 'iframe') {
        session.openInEmbeddedIframe()
      }
      if (options?.open === 'window') {
        session.openInNewWindow()
      }
      return session
    } catch (e) {
      // todo: meaningful error handling
      this.cleanup()
      throw e
    }
  }

  /**
   * Generate a token that only works for an embed development mode.
   * This keeps the "hello world" effort very low but doesn't impact security.
   *
   * @param embedId
   * @param body The raw payload for a normal signed token
   * @param key
   * @private
   */
  public static getDevelopmentToken(
    embedId: string,
    body?: IRawToken,
    key = 'UNSIGNED'
  ): Promise<JsonWebToken> {
    console.warn(
      'Creating an insecure token that can only be used in dev mode.' +
        ' Make sure to sign properly before releasing to production'
    )
    // todo: move these defaults somewhere better
    const payload = {
      ...body,
      user: {
        id: '99',
        email: 'john.doe@example.com',
        name: 'John Doe',
        ...(body?.user ? body.user : {}),
      },
      org: {
        id: '77',
        name: 'Acme Inc.',
        ...(body?.org ? body.org : {}),
      },
    }
    return sign({ embed: embedId, sub: payload.user.email, ...payload, devModeOnly: true }, key)
  }

  /**
   * Merge in any user provided configuration with defaults.
   *
   * @param config User provided configuration
   * @private
   */
  private mergeConfigDefaults(config: IFlatfileImporterConfig): IFlatfileConfig {
    return {
      apiUrl: process.env.API_URL as string,
      mountUrl: process.env.MOUNT_URL as string,
      ...config,
    }
  }
}
