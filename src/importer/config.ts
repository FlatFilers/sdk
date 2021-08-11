export type ENVIRONMENT = 'production' | 'staging' | 'development'
export interface IConfig {
  apiUrl: string
  mountUrl: string
  ws: string
}
export function getConfigByEnv(env: ENVIRONMENT = 'production'): IConfig {
  switch (env) {
    case 'staging': {
      return {
        apiUrl: 'https://api.staging.flatfile.zone',
        mountUrl: 'https://app.staging.flatfile.zone',
        ws: 'ws://api.staging.flatfile.zone',
      }
    }
    case 'development': {
      return {
        apiUrl: 'http://localhost:3000',
        mountUrl: 'http://localhost:8080',
        ws: 'ws://localhost:3000',
      }
    }
    case 'production':
    default: {
      return {
        apiUrl: 'https://api.us.flatfile.io',
        mountUrl: 'https://app.flatfile.io',
        ws: 'ws:api.us.flatfile.io',
      }
    }
  }
}
