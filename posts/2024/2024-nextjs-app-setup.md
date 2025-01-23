---
tags: ["nextjs", "github", "tailwind", "daisyui", "jest", "github-actions", "netlify"]
date: 2025-01-22T12:00:00
title: "Setting up a Next.js application in 2025"
description: "A walkthrough of my usual app setup steps when working on a new web app project"
slug: "nextjs-app-setup"
id: 1733167597032
image: "/post/2025/2025-nextjs-app-setup/next-js-logo.png"
---
- [Introduction](#introduction)
- [GitHub repository setup](#github-repository-setup)
  - [Clone Repo](#clone-repo)
- [Next.js application creation](#nextjs-application-creation)
  - [Running application locally](#running-application-locally)
  - [Initial commit](#initial-commit)
- [Hosting via Netilify](#hosting-via-netilify)
  - [Setup Application on Netlify](#setup-application-on-netlify)
  - [Domain Management](#domain-management)
- [DaisyUI Setup](#daisyui-setup)
- [Unit Testing](#unit-testing)
  - [Jest \& Testing Library Installation](#jest--testing-library-installation)
  - [Initial Test Creation](#initial-test-creation)
- [Linting](#linting)
- [GitHub Actions CI](#github-actions-ci)

## Introduction
Recently, whenever I have started a new web application I have typically followed very similar steps at the start, such as source code setup, app creation and CI/CD setup.

This article will walk you through these different steps I take in case these are useful for you when starting out on your first web application setup.

## GitHub repository setup

Before the creation of the web application, I start by creating a [new GitHub repository](https://github.com/new). This way I can commit my changes and save progress. It also means if something goes wrong, I have a save-point I can go back to.

![github-new-repo](/post/2025/2025-nextjs-app-setup/github-new-repo.png)

### Clone Repo

Next up, I clone the repository to a local location. I recommend [connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh):

```bash
git clone ssh://git@github.com/<username>/<repo-name>.git
```

## Next.js application creation

Once we have the repo setup and cloned locally, we can get started with the initial application setup.

Right now, my go-to framework is Next.js, and their docs provide a lot of info on how to install here:

 - [Next.js: Automatic Installation](https://nextjs.org/docs/app/getting-started/installation#automatic-installation)


```zsh
npx create-next-app@latest
```

Following this initial command, the following prompts will appear. Below I'm showing the options I typically choose:

```zsh
What is your project named? app-setup-2025
Would you like to use TypeScript? Yes
Would you like to use ESLint? Yes
Would you like to use Tailwind CSS? Yes
Would you like your code inside a `src/` directory? Yes
Would you like to use App Router? (recommended) Yes
Would you like to use Turbopack for `next dev`?  No
Would you like to customize the import alias (`@/*` by default)? No
What import alias would you like configured? @/*
```

After a few minutes of installation, the Next.js application will be created in your repo directory instead a new directory matching the project name you selected.

Unless I'm working on a monorepo, I typically prefer the application to exist at root level. So I will run the following command to move the application up one directory and delete the directory Next.js created:

```zsh
mv ./app-setup-2025/* .
rm -rf app-setup-2025
```

### Running application locally

Now the Next.js application has been installed, we can run the application locally to check all is working as expected:

```zsh
npm run dev
```

![Next.js default](/post/2025/2025-nextjs-app-setup/next-js-default.png)

### Initial commit

Now the application is running locally, I'll go ahead commit this to the repo, push, and open a PR.

**Remember to add a .gitignore with node_modules to prevent committing all of the package dependencies!**

```bash
gc -m "Initial Next.js setup"
gpsup
pr
```

Some of the commands I'm using above are custom and more details of these can be found here:

https://www.curtiscode.dev/post/tools/terminal-commands-i-use-on-a-daily-basis


## Hosting via Netilify

I've been using [Netlify](https://www.netlify.com/) to host applications for many years as their free tier has a lot of great benefits, and it's quick and easy to get started.

### Setup Application on Netlify

Once you are logged in on Netlify, the first step is to go to:

> Sites -> Add new site -> Import an existing project

From here, follow the steps to link your GitHub account and select the relevant repository created in early steps.

Netlify is smart enough to detect that the application is a Next.js application, and will automatically configure to support this.

![Netlify Next.js](/post/2025/2025-nextjs-app-setup/netlify-nextjs.png)

At the end of the setup process, Netlify will automatically deploy the site to a subdomain of theirs (e.g: `http://<site-name>.netlify.com`)

![Netlify Deployment](/post/2025/2025-nextjs-app-setup/netlify-deployment.png)

### Domain Management

Netlify has the option to use a custom domain, but this is something I leave until post initial application setup as the Netlify subdomain is a suitable option for initial testing. If you want to learn more, Netlify have documentation on this here:

https://docs.netlify.com/domains-https/custom-domains


## DaisyUI Setup

[daisyUI](https://daisyui.com/) is a popular component library for [Tailwind CSS](https://tailwindcss.com/) and I often install this when starting a new Next.js application, especially as Next.js comes with Tailwind pre-installed.

There are [docs available](https://daisyui.com/docs/install/) for installing daisyUI, but the basic steps are as follows:

```bash
npm i -D daisyui@latest
```

**tailwind.config.ts**:
```ts
import type { Config } from "tailwindcss";
import daisyui from "daisyui";

export default {
  //...
  plugins: [daisyui],
  daisyui: {
    themes: ["dark"],
  },
} satisfies Config;
```

Above I've picked the "dark" theme, but there are [other presets to choose from](https://daisyui.com/docs/themes/), or you can [create custom themes](https://daisyui.com/theme-generator/) too.

Next, apply the theme as a data attribute of the `html` element in the `layout.tsx`:

```tsx
<html lang="en" data-theme="dark">
```

With this in place, we can now override the default `page.tsx` with some daisyUI components;

```tsx
import React from "react";

export default function Home() {
  return (
    <>
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">App Setup 2025</a>
        </div>
        <div className="flex-none">
          <button className="btn btn-square btn-ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-5 w-5 stroke-current">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div className="hero bg-base-200 min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Hello there</h1>
            <p className="py-6">
              Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem
              quasi. In deleniti eaque aut repudiandae et a id nisi.
            </p>
            <button className="btn btn-primary">Get Started</button>
          </div>
        </div>
      </div>
    </>
  );
}
```

![daisyUI Example](/post/2025/2025-nextjs-app-setup/daisyui-example.png)

Before progressing to the next stage, I'll go ahead and commit once again:

```bash
git add -p
git add .
gc -m "DaisyUI Setup"
gp
```


## Unit Testing

For unit testing Next.js applications my preferred packages are [Jest](https://jestjs.io/) and [Testing Library](https://testing-library.com/).

### Jest & Testing Library Installation

```zsh
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @testing-library/react @types/jest @babel/plugin-transform-runtime @babel/preset-env @babel/preset-react @babel/preset-typescript
```

Then initialise Jest:

```zsh
npm init jest@latest
```

Here are the options I choose:


```zsh
✔ Would you like to use Jest when running "test" script in "package.json"? … yes
✔ Would you like to use Typescript for the configuration file? … yes
✔ Choose the test environment that will be used for testing › jsdom (browser-like)
✔ Do you want Jest to add coverage reports? … yes
✔ Which provider should be used to instrument code for coverage? › v8
✔ Automatically clear mock calls, instances, contexts and results before every test? … yes
```

I then make afterwards is to adjust the test scripts so that `npm t` can run jest in watch mode, whereas `test:ci` will run jest with unit test coverage.

```json
"test": "jest --watch",
"test:ci": "jest --ci --collectCoverage"
```

Then add a `babel.config.js` file:

```js
module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
  ],
};
```

Finally, I update the `jest.config.ts` file to include the coverage rules:

```ts
collectCoverageFrom: [
  "**/*.{js,jsx,ts,tsx}",
  "!**/node_modules/**",
  "!**/.next/**",
  "!**/coverage/**",
  "!**/public/**",
  "!**/types/**",
  "!**.config.{js,ts}",
  "!next-env.d.ts"
],
```

### Initial Test Creation

To prove the test setup is complete, we can create a simple test against one of the React components created by the initial Next.js setup.

**page.test.tsx**
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'
import Home from './page';

describe('Page', () => {
  it('renders the navbar with the correct text', () => {
    render(<Home />);
    const navbarText = screen.getByText('App Setup 2025');
    expect(navbarText).toBeInTheDocument();
  });

  it('renders the hero section with the correct heading', () => {
    render(<Home />);
    const heading = screen.getByText('Hello there');
    expect(heading).toBeInTheDocument();
  });

  it('renders the hero section with the correct paragraph', () => {
    render(<Home />);
    const paragraph = screen.getByText(/Provident cupiditate voluptatem et in/i);
    expect(paragraph).toBeInTheDocument();
  });

  it('renders the Get Started button', () => {
    render(<Home />);
    const button = screen.getByText('Get Started');
    expect(button).toBeInTheDocument();
  });
});
```

Finally, we can run `npm run test:ci` to check our new test setup is working correctly:

![Test Result](/post/2025/2025-nextjs-app-setup/jest-test-results.png)


## Linting



## GitHub Actions CI




