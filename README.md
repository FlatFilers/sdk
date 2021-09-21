# @flatfile/sdk

## Install
```
npm install @flatfile/sdk --save
```

## Usage

**flatfileImporter(**`**token**`**)**

**(**[**GitHub**](https://github.com/FlatFilers/sdk/blob/a4ea4abef20c29339bc05cd4e06e27c7618896f1/src/types/interfaces.ts#L3)**)**

```javascript
const importer = flatfileImporter("<%= token %>");
```

### Parameters

| **Name** | **Type** |
| -------- | -------- |
| `token`  | string   |

### Token Generation

The `token` parameter is a JSON Web Token (JWT) generated for a given end user. The JWT should be generated on the application server to prevent dissemination of your private key. The JWT is signed using the the Embed ID of the Flatfile embed (created on the dashboard), the Private Key (also provided on the dashboard, but only available once during the creation of the embed), and an identifier for the end user (an email or other ID).

```javascript
// Example token generation in Node.js:
const jwt = require("jsonwebtoken");

const EMBED_ID = "YOUR_EMBED_ID";
const PRIVATE_KEY = "YOUR_PRIVATE_KEY";

const token = await jwt.sign(
  {
    embed: EMBED_ID,
    sub: currentUser.email, // a unique identifier such as an id or email
  },
  PRIVATE_KEY
);
```

Note: The below snippet is for testing purposes only. This is not safe to use in your production application, but can be useful when testing out for the first time.

```javascript
// Example token generation in the browser *unsafe*
import { flatfileImporter } from "@flatfile/sdk";

const importer = flatfileImporter("");

await importer.__unsafeGenerateToken({
  privateKey: "YOUR_PRIVATE_KEY",
  embedId: "YOUR_EMBED_ID",
  endUserEmail: "max@mail.com",
});

importer.launch();
```

The `sub` field is unique to each end user. This unique identification allows Flatfile to continue an import after an interruption and reduce upload abandonment. For more information on this unique identifier.

# Methods

## **launch**

Launches the Flatfile Importer inside of an iFrame by calling `openInIframe` ([GitHub](https://github.com/FlatFilers/sdk/blob/a4ea4abef20c29339bc05cd4e06e27c7618896f1/src/importer/index.ts#L17)).

```javascript
await importer.launch();
```

## close

Destroys the flatfileImporter.

# Events

The following events will be emitted to the client.

## init

Returns a `batchId` unique to the end user the token was generated for. This allows uploads to be continued after an interruption (such as a user closing a browser tab) and can be used to request data from the Flatfile API.

```php
importer.on('init', ({ batchId }) => {
  console.log(`Batch ${batchId} has been initialized.`)
})
```

## launch

Returns the same `batchId` generated during initialization (see above) that is unique to the end user the token was generated for. This allows uploads to be continued after an interruption (such as a user closing a browser tab) and can be used to request data from the Flatfile API.

```javascript
importer.on("launch", ({ batchId }) => {
  console.log(`Batch ${batchId} has been launched.`);
});
```

## error

Returns a JavaScript error object.

```javascript
importer.on("error", (error) => {
  console.error(error);
});
```

## complete

Returns a payload with a copy of the validated data from the upload.

```javascript
importer.on("complete", async (payload) => {
  console.log(JSON.stringify(await payload.data(), null, 4));
});
```

