<p align="center">
	<img width="240px" height="auto" src="https://ipfs.io/ipfs/QmRZXurxmTZwQC2GPrdNidPJ3PS4SrXSFqkeeoV24DXt4e" />
</p>
<p align="center">
	A lightweight TypeScript library designed for creating SPAs, that is complementary to the browser's
	native APIs. Small yet powerful. Simple yet still useful.
</p>

## Features ⚡

**Core + Extra ( minified + gzipped 2.6kb )**

### Core ( minified + no-gzip 3.0kb )

-  Signals with `signal` and `derive` - all of reactivity is possible thanks to signals
-  Templating with `TagsNS` - makes it easier to build dom elements within JS/TS, with support for signals
-  `populate` - Easily populate dom elements with children, attributes and directives such as `style:*`, `class:*`, `on:*` and `bind:value`, with support for signals
-  `onConnected$` - Get a callback when ever a Node (Element, Comment, Text, ...) gets connected/disconnected to/from dom.

### Extra ( minified + no-gzip 2.5kb )

-  Templating tags `html` and `css` - write HTML and CSS within JS/TS
-  `defer` - Deferring signals
-  `each` - Map a array signal while memoizing results with a key for minimum DOM change
-  `awaited` - Await a promise using signals
-  `match` - Pattern matching for both signals and values
-  `keyedCache` - Memoizing anything else you want using keys
-  `defineCustomTag` - Shortcut to define empty custom elements easily

## Installation 🍙

[Install Instructions](https://github.com/DeepDoge/master-ts/releases)

## Documentation 🍱

Work in progress

[Currently Available Unfinished Documentation](https://ipfs.io/ipfs/QmXiJTiwBYNjiKt5eW5RF6Pd8wdrtxe1hRNff5rxbNeTyt)

## Motivation 🍣

These days, frameworks are getting more and more complex. They are getting more and more opinionated, some are getting their own languages.
And most importantly, they are trying to do everything at once SSR, SSG, SPA, HMR, etc.

Meanwhile, native browser APIs are getting better and better, and **master-ts** is designed to be complementary to native browser APIs, not to replace them.

By only focusing on SPAs, **master-ts** is able work better with the browser's native APIs.
This also makes it easier to learn, and easier to use with other libraries and frameworks. If you know vanilla JS you know **master-ts**

**master-ts** doesn't tell you how to build a component, how to mount a component, or what is a component. Because these things are not meant to be this complicated. Define a function, create an `Element` or `Node`, throw it into the DOM any way you want, and you are done. Put a `signal` in it, and it will be reactive. Remove it from the DOM, append it back, again multiple times, and it will still work.

It gives you the freedom to build your app however you want:

-  Wanna use Shadow DOM? Go ahead.
-  Wanna use Custom Elements? Go ahead.
-  Wanna use fragments with CSS `@scoped`? Go ahead.
-  Wanna use history API? Go ahead.
-  Wanna use hash router? Go ahead.

Do whatever you want, in the way you want, and **master-ts** will work with you.

## Philosophy 🍜

-  **Lightweight** - It's only 2.6kb minified and gzipped.
-  **Complementary** - It's designed to be complementary to the browser's native APIs, not to replace them.
-  **Minimal** - It's designed to be minimal, and only focus on SPAs.
-  **Simple** - It's designed to be simple, and easy to learn.
-  **Flexible** - It's designed to be flexible, and work with other libraries and frameworks.
-  **TypeScript** - It's designed to be used with TypeScript, and leverage the power of TypeScript.

## Vite Plugin

Vite plugin doesn't support the latest version of master-ts atm.

~~MasterTS is a UI building library. So you may wonder, why does a library have a "Vite" plugin? The truth is, you don't actually need this plugin for MasterTS to work. The plugin simply bakes your MasterTS code, including HTML templates, at build time to improve runtime performance.~~

~~So it's recommended that you use [MasterTS Vite Plugin](https://github.com/DeepDoge/master-ts-vite-plugin)~~
