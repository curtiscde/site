---
title: "Create a flashing tab notification page title"
slug: "create-a-flashing-tab-notification-page-title"
date: 2014-06-04T00:00:00
description: "Learn how to create flashing page title, or use/fork the existing version"
tags: ["javascript", "notification", "page-title", "project"]
image: "/post/2014-flashing-page-title/newchatmessage.png"
id: 21
---
> **Updated October 2026:** the package is now [`flashing-page-title`](https://www.npmjs.com/package/flashing-page-title), an ES module, with a [new demo site](https://flashing-page-title.curtiscode.dev). The examples below are up to date.

Page title notifications switch between the default page title and a notification message continously in order to grab the user's attention. This is commonly used with chat applications.

![New chat message notification](/post/2014-flashing-page-title/newchatmessage.gif)

I've written a small, dependency-free library which can be used to switch on and off page title notifications.

## Install

```bash
npm install flashing-page-title
```

## Usage

To activate the page title notification call the following:

```js
import { flashingPageTitle } from "flashing-page-title";

flashingPageTitle.on("New Message!");
```

Then call the following to turn it off, which also restores the original page title:

```js
flashingPageTitle.off();
```

The default speed is 1000 milliseconds, but this can be customised by passing a 2nd parameter to the `on()` function.

```js
flashingPageTitle.on("New Message!", 5000);
```

### Without a bundler

You can also load it straight into the page as an ES module:

```html
<script type="module">
  import { flashingPageTitle } from "https://esm.sh/flashing-page-title@3";

  flashingPageTitle.on("New Message!");
</script>
```

## Demo

Try it out, with copyable examples for React and more:

https://flashing-page-title.curtiscode.dev

## GitHub

Full source code available on GitHub. Please feel free to raise any issues or pull requests!

https://github.com/curtiscde/flashing-page-title
