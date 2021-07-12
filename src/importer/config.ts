export type ENVIRONMENT = 'production' | 'staging' | 'development'
export interface IConfig {
  apiUrl: string
  mountUrl: string
}
export function getConfigByEnv(env: ENVIRONMENT = 'production'): IConfig {
  switch (env) {
    case 'staging': {
      return {
        apiUrl: 'https://api.staging.flatfile.zone',
        mountUrl: 'https://app.staging.flatfile.zone',
      }
    }
    case 'development': {
      return {
        apiUrl: 'http://localhost:3000',
        mountUrl: 'http://localhost:8080',
      }
    }
    case 'production':
    default: {
      return {
        apiUrl: 'https://api.us.flatfile.io',
        mountUrl: 'https://app.flatfile.io',
      }
    }
  }
}
