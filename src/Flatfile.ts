import { FlatfileError } from './errors/FlatfileError'
import { ImplementationError } from './errors/ImplementationError'
import { ApiService } from './graphql/ApiService'
import { IChunkOptions, ImportSession } from './importer/ImportSession'
import { isJWT, sign } from './lib/jwt'
import { IteratorCallback } from './lib/RecordChunkIterator'
import { TypedEventManager } from './lib/TypedEventManager'
import { IResponsePromise, ResponsePromise } from './service/ResponsePromise'
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
  }

  public async token(): Promise<JsonWebToken> {
    if (this.config.token) return this.config.token
    if (this.config.onAuth) {
      this.ui.updateLoaderMessage(EDialogMessage.Authenticating)
      const token = await this.config.onAuth()
      if (!isJWT(token)) {
        throw new ImplementationError('onAuth() has to return a valid JWT')
      }
      this.ui.updateLoaderMessage(EDialogMessage.Default)
      return token
    }
    if (this.config.embedId) {
      return Flatfile.getDevelopmentToken(this.config.embedId, {
        org: this.config.org || { id: 1, name: 'Company' },
        user: this.config.user || { id: 1, name: 'John Doe', email: 'john@email.com' },
      })
    } else throw new ImplementationError('No token or onAuth callback was provided')
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
    options?: IOpenOptions & IImportSessionConfig
  ): Promise<ImportSession> {
    try {
      if (options?.open) {
        this.ui.showLoader()
      }
      const api = await this.initApi()
      const meta = await api.init()
      const { mountUrl } = this.config

      const session = new ImportSession(this, { mountUrl, ...meta })

      if (options?.onInit) session.on('init', options.onInit)
      if (options?.onComplete) session.on('complete', options.onComplete)
      if (options?.onError) session.on('error', options.onError)

      session.init()
      this.emit('launch', { batchId: meta?.batchId }) // todo - should this happen here

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
    let callback: IteratorCallback | undefined
    let options: DataReqOptions = { open: 'iframe' }
    if (typeof callbackOrOptions === 'function') {
      callback = callbackOrOptions
      options = opts ? { ...options, ...opts } : options
    } else if (typeof callbackOrOptions === 'object') {
      options = { ...options, ...callbackOrOptions }
      callback = options.onData
    }

    const response = new ResponsePromise()

    this.startOrResumeImportSession(options).then((session) => {
      if (callback) {
        session.on('submit', () => {
          session.processPendingRecords(callback as IteratorCallback, options)
        })
      } else {
        /**
         * requestDataFromUser() will return a Promise if callback is not provided
         */
        session.on('complete', (payload) => {
          response.resolve(payload)
          session.iframe?.close()

          if (!options.onComplete) {
            console.log('[Flatfile]: Register `onComplete` event to receive your payload')
          }
        })
        session.on('error', ({ error }) => {
          response.reject(error)
        })
      }
    })
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

  public static requestDataFromUser(
    options: DataReqOptions & IFlatfileImporterConfig
  ): void | IResponsePromise {
    const { mountUrl, apiUrl, embedId, user, org, onAuth, ...sessionConfig } = options
    const flatfile = new Flatfile({ mountUrl, apiUrl, embedId, user, org, onAuth })

    return flatfile.requestDataFromUser(sessionConfig)
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

type DataReqOptions = IOpenOptions & IChunkOptions & IImportSessionConfig
