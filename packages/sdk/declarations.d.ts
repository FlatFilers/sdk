/* eslint-disable @typescript-eslint/no-empty-interface */
import { EnvironmentVariables } from './src/config';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      HOST?: string;
      PORT?: string;
      API_URL?: string;
      MOUNT_URL?: string;
      DEFAULT_PAGE_LIMIT?: string;

    }
    interface Global {}
  }
}

export {};
