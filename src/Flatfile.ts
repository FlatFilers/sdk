import { FlatfileError } from './errors/FlatfileError'
import { UnauthorizedError } from './errors/UnauthorizedError'
import { ApiService } from './graphql/ApiService'
import { IChunkOptions, ImportSession } from './importer/ImportSession'
import { sign } from './lib/jwt'
import { IteratorCallback } from './lib/RecordChunkIterator'
import { TypedEventManager } from './lib/TypedEventManager'
import { IEvents, IFlatfileConfig, IFlatfileImporterConfig, IRawToken, JsonWebToken } from './types'

export class Flatfile extends TypedEventManager<IEvents> {
  /**
   * The configuration of this instance of Flatfile with defaults merged in
   */
  public readonly config: IFlatfileConfig

  constructor(config: IFlatfileImporterConfig = {}) {
    super()
    this.config = this.mergeConfigDefaults(config)
  }

  public async token(): Promise<JsonWebToken> {
    if (this.config.token) return this.config.token
    if (this.config.onAuth) return this.config.onAuth()
    else throw new UnauthorizedError('No token or onAuth callback was provided')
  }

  /**
   * Creates a new pre-authenticated instance of the API service
   */
  private async api(): Promise<ApiService> {
    const token = await this.token()
    return new ApiService(token, this.config.apiUrl)
  }

  /**
   * Start a new import or resume the one that's currently in progress
   */
  public async startOrResumeImportSession(options?: IOpenOptions): Promise<ImportSession> {
    try {
      const api = await this.api()
      const importMeta = await api.init()
      const { mountUrl } = this.config

      this.emit('launch', { batchId: importMeta.batchId }) // todo - should this happen here
      const session = new ImportSession(api, { ...importMeta, mountUrl })
      session.emit('init', importMeta)
      if (options?.open === 'iframe') {
        session.openInEmbeddedIframe({ autoContinue: options?.autoContinue })
      }
      if (options?.open === 'window') {
        session.openInNewWindow({ autoContinue: options?.autoContinue })
      }
      return session
    } catch (e) {
      this.handleError(e as FlatfileError)
      this.cleanup()
      throw e
    }
  }

  /**
   * Simple function that abstracts away some of the complexity for a single line call
   * also provides some level of backwards compatability
   */
  public requestDataFromUser(): this
  public requestDataFromUser(opts: DataReqOptions): this
  public requestDataFromUser(callback: IteratorCallback, opts?: DataReqOptions): this
  public requestDataFromUser(
    cbOpts?: IteratorCallback | DataReqOptions,
    opts?: DataReqOptions
  ): this {
    let callback: IteratorCallback | undefined
    let options: DataReqOptions = { open: 'window' }
    if (typeof cbOpts === 'function') {
      callback = cbOpts
      options = opts ? { ...options, ...opts } : options
    } else if (typeof cbOpts === 'object') {
      options = { ...options, ...cbOpts }
    }

    this.startOrResumeImportSession(options).then((session) => {
      session.on('submit', () => {
        if (callback) {
          session.processPendingRecords(callback, options)
        }
      })
    })
    return this
  }

  public handleError(error: FlatfileError): void {
    if (this.hasListener('error')) {
      this.emit('error', { error })
    } else {
      alert(`[${error.code}] ${error.userMessage}`)
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

interface IOpenOptions {
  open?: 'iframe' | 'window'
  autoContinue?: boolean
}

type DataReqOptions = IOpenOptions & IChunkOptions
