---
title: "Create a flashing tab notification page title"
slug: "create-a-flashing-tab-notification-page-title"
date: 2014-06-04T00:00:00
description: "Learn how to create flashing page title, or use/fork the existing version"
tags: ["javascript", "notification", "page-title", "project"]
image: "/post/2014-flashing-page-title/newchatmessage.png"
id: 21
---
Page title notifications switch between the default page title and a notification message continously in order to grab the user's attention. This is commonly used with chat applications.

![New chat message notification](/post/2014-flashing-page-title/newchatmessage.gif)

I've written a small javascript object which can be used to switch on and off page title notifications.

To activate the page title notification call the following:

```js
pageTitleNotification.on("New Message!");
```

Then call the following to turn it off:

```js
pageTitleNotification.off()
```

The default speed is 1000 milliseconds, but this can be customised by passing a 2nd parameter to the `on()` function.

```js
pageTitleNotification.on("New Message!", 5000);
```

## Download

There are various ways you can integrate this into your project:

### npm
Run the following `npm install` command:

```js
npm install flashing-page-title-notification --save
```

https://www.npmjs.com/package/flashing-page-title-notification

### Minified file

Download the minified javascript version from GitHub:

<a href="https://github.com/curtiscde/Flashing-Page-Title-Notification/blob/master/dist/PageTitleNotification.min.js" target="_blank">PageTitleNotification.min.js</a>

## Demo

https://flashing-page-title-notification.netlify.com/demo

## GitHub

Full source code available on GitHub. Please feel free to raise any issues or pull requests!

https://github.com/curtiscde/Flashing-Page-Title-Notification
