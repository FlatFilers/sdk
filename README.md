# @flatfile/sdk

## Install
```
npm install @flatfile/sdk
```

## Getting started

Make sure you are in Developer Mode by clicking the toggle in the bottom left corner of the Flatfile dashboard.

### Get your Embed ID

First, grab your Embed ID for the Portal you want to embed. You can find this on the Edit Portal page in the Flatfile dashboard, and it should look something like this:

`76aa0b10-d7f8-4dc7-a007-4a791736eed1`

### Embed your Portal

Use the following code to embed your Portal into your app:

```ts
import { Flatfile } from "@flatfile/sdk";

// find this in your Flatfile dashboard after creating a new Portal
const EMBED_ID = "";

// use this wherever you need to trigger an import
export function importData() {
  Flatfile.requestDataFromUser({
    embedId: EMBED_ID,
    user: { id: 99, name: "John Doe", email: "john@doe.com" },
    org: { id: 77, name: "Acme Inc." },
    onData(chunk, next) {
      /* handle submitted data here */
    },
  });
}

// change this to whatever DOM trigger you want to use
document.getElementById("button").addEventListener("click", importData);
```

This should open the Portal upon clicking the element you passed to `document.getElementById`. Try it out by uploading a CSV, and see your cleaned data appear in your Flatfile dashboard!

Check out additional options for `requestDataFromUser` in the [Flatilfe developer docs](https://flatfile.com/docs/embedding-flatfile/accepting-data/#options).

## Next steps

Check out the [Flatfile developer docs](https://flatfile.com/docs) to see what's needed to get your Portal working in production, including:

1. [Accepting data](https://flatfile.com/docs/embedding-flatfile/accepting-data)
2. [Securing data](https://flatfile.com/docs/embedding-flatfile/securing-data/)
3. [Using Data Hooks®](https://flatfile.com/docs/data-hooks/overview/)

