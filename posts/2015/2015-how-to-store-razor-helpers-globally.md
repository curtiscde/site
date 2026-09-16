---
title: "How to store razor helpers globally"
slug: "how-to-store-razor-helpers-globally"
tags: ["app_code", "asp.net", "asp.net-mvc", "helper", "razor"]
date: 2015-03-25T00:00:00
id: 5
---
ASP.NET MVC Razor helpers are a great way of reducing duplicated code by containing code snippets in a View which can then be called multiple times.

```html
<div>
    @DisplayGreeting("Curtis")
</div>

@helper DisplayGreeting(string name)
{
    <span>Hello @name</span>
}
```

However what if you wish to call this same helper on another View?

In which case the helper can be stored in a seperate View in the "App_Code" folder.

For example create a new View in the "App_Code" folder called "MyHelpers.cshtml":

![Visual Studio Solution Explorer showing MyHelpers.cshtml inside the App_Code folder](/post/2015-how-to-store-razor-helpers-globally/HelpersSolutionExplorer.jpg)

Move the helper code into this file:

![The MyHelpers.cshtml file open in Visual Studio, containing the @helper DisplayGreeting block](/post/2015-how-to-store-razor-helpers-globally/MyHelpersView.jpg)

Then the helper can be called from the previous view by using `MyHelpers.DisplayGreeting`:

```html
<div>
    @MyHelpers.DisplayGreeting("Curtis")
</div>
```

This way any View within the same ASP.NET MVC Application can then make use of this helper.
