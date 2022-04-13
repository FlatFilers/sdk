# Changelog

### 3.1.0

Update to the latest version of `@flatfile/sdk` (1.0.5), which adds `mountUrl` and `apiUrl` support.

Now available as _optional_ `@Input()`'s (both are of type String)

```html
  <flatfile-button [token]="token"
    [mountUrl]="mountUrl"
    [apiUrl]="apiUrl">
    Upload to Flafile
  </flatfile-button>
```

### 3.0.0
This release utilizes the new flatfile/sdk which has numerous breaking changes.
Read through the documentation (readme) and sample code provided here to see how you can upgrade your existing flatfile-button to this latest SDK.

The only thing **REQUIRED** now for `<flatfile-button>` is the Input **`[token]`**, which you must retrieve from your backend.

**More information [here](https://flatfile.com/docs/implementing-embeds/)**

### 1.2.9
Minor release to bump base adapter version to fix minor bug there.

### 1.2.8

Fixed underlying `@flatfile/adapter` package to fix this packages ability to work with older versions of Angular (such as v8).

### 1.2.6

Fix broken codesandbox link
### 1.2.4

Update to use the latest `@flatfile/adapter` fixing build/compilation bugs for exports not publicly available, clean up default export usage, and redundant interfaces found in this package (using adapter base version now).

### 1.2.0

New feature @Input `[mountUrl]=""` added.

### 1.1.4

Fix compatibility with older Angular v8 (and lower) + older TypeScript versions.

### 1.1.3

Fix onData bug when not present in user code.

### 1.1.2

Exported `FlatfileCustomer` interface.
`ISettings` and renamed to `FlatfileSettings`.
### 1.1.1

Improved Flatfile configuration object to provide `licenseKey | settings | customer` objects and type definitions.

### 1.0.2

Fixed import for FlatfileResults to come from @flatfile/angular library correctly.

### 1.0.0

Breaking Changes:

2-way binding for data, recordInit, recordChange removed.

2-way binding for data, recordInit, recordChange removed.
Methods have been renamed (to avoid confusion) and now need to be passed via 1-way binding, utilizing `.bind(this)` which will ensure parent component classes context. (Incase users need to call internal methods/properties/etc from within their component class).

Previously:

```html
[(data)]="onData"
[(recordInit)]="onRecordInit"
[(recordChange)]="onRecordChange"
```

Now, the methods have `on` prepending the name, and are 1-way binding *Input*'s.

```html
[onData]="onData.bind(this)"
[onRecordInit]="onRecordInit.bind(this)"
[onRecordChange]="onRecordChange.bind(this)"
```
