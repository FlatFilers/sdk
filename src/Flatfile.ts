import { FlatfileError } from './errors/FlatfileError'
import { ImplementationError } from './errors/ImplementationError'
import { ApiService } from './graphql/ApiService'
import { IChunkOptions, ImportSession, IUrlOptions } from './importer/ImportSession'
import { isJWT, sign } from './lib/jwt'
import { IteratorCallback } from './lib/RecordChunkIterator'
import { TypedEventManager } from './lib/TypedEventManager'
import { UIService } from './service/UIService'
import {
  IEvents,
  IFlatfileConfig,
  IFlatfileImporterConfig,
  IImportSessionConfig,
  IRawToken,
  JsonWebToken,
} from './types'
import { EDialogMessage } from './types/enums/EDialogMessage'

export class Flatfile extends TypedEventManager<IEvents> {
  /**
   * The configuration of this instance of Flatfile with defaults merged in
   */
  public readonly config: IFlatfileConfig

  /**
   * Reference to a pre-authenticated instance of the API service
   */
  public api?: ApiService

  public ui: UIService

  constructor(config: IFlatfileImporterConfig)
  constructor(token: string, config: IFlatfileImporterConfig)
  constructor(
    tokenOrConfig: string | IFlatfileImporterConfig,
    config: IFlatfileImporterConfig = {}
  ) {
    super()
    const configWithToken =
      typeof tokenOrConfig === 'object' ? tokenOrConfig : { ...config, token: tokenOrConfig }
    this.config = this.mergeConfigDefaults(configWithToken)
    this.ui = new UIService()
    if (this.config.onError) {
      this.on('error', this.config.onError)
    }
  }

  /**
   * Returns / resolves a token or generates a JWT from embedId, user & org
   */
  public async token(): Promise<JsonWebToken> {
    if (typeof this.config.token !== 'undefined') {
      return this.extractToken()
    } else if (this.config.embedId) {
      return Flatfile.getDevelopmentToken(this.config.embedId, {
        org: this.config.org || { id: 1, name: 'Company' },
        user: this.config.user || { id: 1, name: 'John Doe', email: 'john@email.com' },
      })
    } else {
      throw new ImplementationError(
        '`embedId` or `token` property is required to initialize Flatfile.'
      )
    }
  }

  private async extractToken(): Promise<JsonWebToken> {
    this.ui.updateLoaderMessage(EDialogMessage.Authenticating)
    const { token: rawToken } = this.config
    const token =
      typeof rawToken === 'string'
        ? rawToken
        : typeof rawToken === 'function'
        ? await rawToken()
        : ''
    if (!isJWT(token)) {
      throw new ImplementationError('`token` has to return a valid JWT.')
    }
    this.ui.updateLoaderMessage(EDialogMessage.Default)
    return token
  }

  /**
   * Creates a new pre-authenticated instance of the API service
   */
  private async initApi(): Promise<ApiService> {
    if (!this.api) {
      const token = await this.token()
      this.api = new ApiService(token, this.config.apiUrl)
    }
    return this.api
  }

  /**
   * Start a new import or resume the one that's currently in progress
   */
  public async startOrResumeImportSession(
    options?: IOpenOptions & IChunkOptions & IImportSessionConfig
  ): Promise<ImportSession> {
    try {
      if (options?.open) {
        this.ui.showLoader()
      }
      const api = await this.initApi()
      const meta = await api.init()
      const { mountUrl } = this.config

      const session = new ImportSession(this, { mountUrl, ...meta })
      const { chunkSize, chunkTimeout } = options ?? {}

      if (options?.onInit) session.on('init', options.onInit)
      session.on('submit', async () => {
        if (options?.onData) {
          const iterator = await session.processPendingRecords(options.onData, {
            chunkSize,
            chunkTimeout,
          })
          if (iterator.rejectedIds.length === 0) {
            session.iframe?.close()
            options.onComplete?.({
              batchId: meta.batchId,
              data: (sample = false) => api.getAllRecords(meta.batchId, 0, sample),
            })
          }
        } else {
          if (options?.onComplete) {
            session.iframe?.close()
            options.onComplete?.({
              batchId: meta.batchId,
              data: (sample = false) => api.getAllRecords(meta.batchId, 0, sample),
            })
          } else {
            console.log('[Flatfile]: Register `onComplete` event to receive your payload')
          }
        }
      })

      setTimeout(() => {
        session.init()
        /** @deprecated */
        this.emit('launch', { batchId: meta?.batchId })
      }, 0)

      if (options?.open === 'iframe') {
        const importFrame = session.openInEmbeddedIframe({ autoContinue: options?.autoContinue })
        importFrame.on('load', () => this.ui.hideLoader())
      }
      if (options?.open === 'window') {
        session.openInNewWindow({ autoContinue: options?.autoContinue })
        this.ui.destroy()
      }
      return session
    } catch (e) {
      this.ui.destroy()
      this.handleError(e as FlatfileError)
      this.cleanup()
      throw e
    }
  }

  /**
   * Simple function that abstracts away some of the complexity for a single line call
   * also provides some level of backwards compatability
   */
  public requestDataFromUser(): void
  public requestDataFromUser(opts: DataReqOptions): void
  public requestDataFromUser(cb: IteratorCallback, opts?: DataReqOptions): void
  public requestDataFromUser(
    callbackOrOptions?: IteratorCallback | DataReqOptions,
    opts?: DataReqOptions
  ): void {
    let options: DataReqOptions = { open: 'iframe' }
    if (typeof callbackOrOptions === 'function') {
      options = opts ? { ...options, ...opts, onData: callbackOrOptions } : options
    } else if (typeof callbackOrOptions === 'object') {
      options = { ...options, ...callbackOrOptions }
    }

    this.startOrResumeImportSession(options)
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

  public static requestDataFromUser(options: DataReqOptions & IFlatfileImporterConfig = {}): void {
    const { sessionConfig, importerConfig } = Flatfile.extractImporterOptions(options)
    const flatfile = new Flatfile(importerConfig)
    return flatfile.requestDataFromUser(sessionConfig)
  }

  public static extractImporterOptions(options: DataReqOptions & IFlatfileImporterConfig): {
    sessionConfig: DataReqOptions
    importerConfig: IFlatfileImporterConfig
  } {
    const sessionConfig = {} as DataReqOptions
    const importerConfig = {} as IFlatfileImporterConfig
    Object.entries(options).forEach(([key, val]) => {
      if (SESSION_CONFIG_KEYS.indexOf(key as keyof DataReqOptions) !== -1) {
        sessionConfig[key as keyof DataReqOptions] = val
      } else if (IMPORTER_CONFIG_KEYS.indexOf(key as keyof IFlatfileImporterConfig) !== -1) {
        importerConfig[key as keyof IFlatfileImporterConfig] = val
      } else {
        throw new ImplementationError(`Field "${key}" should not exist on the config.`)
      }
    })

    return {
      sessionConfig,
      importerConfig,
    }
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
      ...Object.entries(config).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key as keyof IFlatfileConfig] = value
        }
        return acc
      }, {} as Partial<IFlatfileConfig>),
    }
  }
}

export const SESSION_CONFIG_KEYS: (keyof DataReqOptions)[] = [
  'autoContinue',
  'customFields',
  'chunkSize',
  'onComplete',
  'onData',
  'onInit',
  'open',
]

export const IMPORTER_CONFIG_KEYS: (keyof IFlatfileImporterConfig)[] = [
  'apiUrl',
  'embedId',
  'mountUrl',
  'onError',
  'org',
  'token',
  'user',
]

type IOpenOptions = {
  open?: 'iframe' | 'window'
} & IUrlOptions

type DataReqOptions = IOpenOptions & IChunkOptions & IImportSessionConfig
