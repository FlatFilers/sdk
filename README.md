# @flatfile/sdk

## Install
```
npm install @flatfile/sdk --save
```

### Native
- Run `npm start` to start the development environment. Once running, the app will be available at `localhost:8080`.

### Docker
- Run `docker compose up -d app` to start the docker container. Once running, the app will be available at `localhost:8080`.

## Build

### Production
A production bundle can be created via:
```
npm run build
```
The results of which can be found in the `dist` directory.

Once bundled, the package can be consumed in the following ways:
```js
// CommonJS
const flatfileImporter = require('@flatfile/sdk');

// AMD
import flatfileImporter from '@flatfile/sdk';

// Script tag - available as a global variable: window.flatfileImporter 
<script src="https://example.com/path/to/hosted/sdk.js" />
```

### Sandbox
A sandbox bundle can be created via:
```shell
npm run build:sandbox
```

This will generate static build of the sandbox environment in `__sandbox__/dist`.

## Publish
Publishing only requires a single command, `npm publish`. This will automatically create a fresh production bundle, via 
the `prepack` script, before being submitted to NPM.
