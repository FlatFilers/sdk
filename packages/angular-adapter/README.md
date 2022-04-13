# Flatfile Angular Component - @flatfile/angular

[![npm](https://img.shields.io/npm/v/@flatfile/angular.svg?label=npm%20version&color=2EBF6A&style=for-the-badge)](https://www.npmjs.com/@flatfile/angular)
[![Minzipped Size](https://img.shields.io/bundlephobia/minzip/@flatfile/angular?color=794cff&style=for-the-badge)](https://bundlephobia.com/result?p=@flatfile/angular)
[![NPM Downloads](https://img.shields.io/npm/dw/@flatfile/angular.svg?color=8c66ff&style=for-the-badge)](https://www.npmjs.com/@flatfile/angular)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge&color=794cff)](/LICENSE)

---

> NOTE: If you upgrading from previous versions (2.x), v3+ comes with some updates & breaking changes

#### BREAKING CHANGES:

Note that the latest version of `@flatfile/angular` 3+ uses the new `@flatfile/sdk` underneath which changes the API surface of interacting with the flatfile adapter entirely.

[Read more about these changes here](https://flatfile.com/docs/implementing-embeds/)

There is now only 1 required input, and that is `[token]` (which you must receive from your backend).

[Read more about generating a Token here](https://flatfile.com/docs/sdk/)

## Getting Started with Flatfile & Angular

We've made it really simple for you to get started with Flatfile with our new Flatfile Component. Here's what you'll need to know to get started.

First, install the dependency via npm:

`npm install @flatfile/angular`

This will give you access to the `<flatfile-button />` component as well as the same basic functionality as our Adapter.

---

#### Changelog

To view information about the latest releases and any minor/major changes, check out the [changelog here](./CHANGELOG.md).

---

<!-- ## Codesandbox Demo

Try it for yourself in the [CodesandBox here](https://codesandbox.io/s/flatfile-angular-demo-w10yx?file=/src/app/app.component.ts). -->

---

## Getting Started with <flatfile-button>

```ts
import { FlatfileAdapterModule } from '@flatfile/angular';

// Add to your Modules imports: []
imports: [
  FlatfileAdapterModule
]
```

#### Within a Components template use the flatfile-button:

The only thing **REQUIRED** for `<flatfile-button>` is the Input **`[token]`**, which you must retrieve from your backend.

**More information [here](https://flatfile.com/docs/implementing-embeds/)**

Now let's look at a simple example of getting everything up and running.

```ts
import {
  // This interface is optional, but helpful to show you all the available required & optional inputs/outputs available to you
  FlatfileMethods,
  // The "Params" interfaces are useful to strongly type your output methods
  CompleteParams, 
  ErrorParams,
} from "@flatfile/angular";

@Component({
  template: `
    <flatfile-button
      [token]="token"
      (onComplete)="onComplete($event)"
      (onError)="onError($event)"
      class="flatfile-button"
    >
      Text you want to show for the button
    </flatfile-button>
  `,
}) export class MyDemoComponent implements FlatfileMethods {
  /**
   * @NOTE - Call your backend & retrieve your Token, and pass down the license key
   * 👇👇👇
   */
  token = 'YOUR_TOKEN_HERE';
  results;

  onComplete(event: CompleteParams) {
    console.log(`onComplete`);
    console.log(event);

    // Your data!
    this.results = event.data;
  }
  onError(event: ErrorParams) {
    console.log(`onError`);
    console.log(event);
  }
  
}
```

---

### More advanced use-case example (kitchen sink)

This is an example showcase all of the other additional (and optional) `@Output()` methods you could subscribe to.

We're also showcasing how you can **style** your flatfile-button as well!

Notice we're using all the Params interface (`InitParams` | `LaunchParams` etc to strongly type our Output method return values).

Within a Components template use the flatfile-button

```ts
import {
  // This interface is optional, but helpful to show you all the available required & optional inputs/outputs available to you
  FlatfileMethods,
  // The "Params" interfaces are useful to strongly type your output methods
  InitParams,
  LaunchParams,
  CompleteParams,
  ErrorParams,
  UploadParams,
} from "@flatfile/angular";

@Component({
  template: `
    <flatfile-button
      [token]="token"
      [mountUrl]="mountUrl"
      [apiUrl]="apiUrl"
      (onInit)="onInit($event)"
      (onLaunch)="onLaunch($event)"
      (onComplete)="onComplete($event)"
      (onUpload)="onUpload($event)"
      (onError)="onError($event)"
      (onClose)="onClose()"
      class="flatfile-button"
    >
      Text you want to show for the button
    </flatfile-button>
  `,
  /**
   * @note IMPORTANT if you want to style the child component
   * from this "parent" component
   */
  encapsulation: ViewEncapsulation.None,
  /**
   * @note We gave our <flatfile-button class="flatfile-button"> a class,
   * and if we access the "button" inside of that, we can style it however we want!
   */
  styles: [`
    .flatfile-button button {
      border: 0;
      border-radius: 3px;
      padding: 1rem;
      background: #794cff;
      color: #fff;
    }
  `,
}) export class MyDemoComponent implements FlatfileMethods {
  
  /**
   * @NOTE - Call your backend & retrieve your Token, and pass down the license key
   * 👇👇👇
   */
  token = 'YOUR_TOKEN_HERE';

  /** optional **/
  mountUrl = '';
  /** optional **/
  apiUrl = '';

  results;

  /*
   * @Output() methods, make sure they are passed down to <flatfile-button>
   */
  onInit(event: InitParams) {
    console.log(`onInit`);
    console.log(event);
  }
  onUpload(event: UploadParams) {
    console.log(`onUpload`);
    console.log(event);
  }
  onLaunch(event: LaunchParams) {
    console.log(`onLaunch`);
    console.log(event);
  }
  onClose() {
    console.log(`onClose`);
  }
  onComplete(event: CompleteParams) {
    console.log(`onComplete`);
    console.log(event);

    this.results = event.data;
  }
  onError(event: ErrorParams) {
    console.log(`onError`);
    console.log(event);
  }
  
}
```

#### Styling the component

As mentioned above, note that in order to style this child-component (from the parent), simply supply a `class=""` to the `<flatfile-button class="some_class_name">`, and ensure that your parent component has `encapsulation` set to `ViewEncapsulation.None` (showcased above in this advanced demo). 

Then you can style it with css via:

```css
.some_class_name button { 
  /* my styles */ 
  background: #000;
  border: 0;
  color: #fff;
}
```

---

### Running the sample application

```bash
npm i && npm start
```

The same application will be fired up at `http://localhost:4200`.

> Ensure that you've entered in a valid `token` in the `AppComponent` file (`projects/sample/app.component.ts`).

---

### Publishing

Ensure that the correct semantic version has been updated in the `projects/angular-adapter/package.json` version.

Make sure that if you're updating the (base package) `@flatfile/adapter` version, to update it within the dependencies array of the `package.json` within the projects/angular-adapter/ library as well.

Then run:

```bash
npm run build:prod
npm run publish:pkg
```
