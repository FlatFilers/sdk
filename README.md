# @flatfile/sdk

## Install
```
npm install @flatfile/sdk --save
```

## Development
- Copy `.env.example` to `.env` and add an `API_TOKEN`
- Run `npm start` to start the development environment

## Build
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

## Publish
Publishing only requires a single command, `npm publish`. This will automatically create a fresh production bundle, via 
the `prepack` script, before being submitted to NPM.
