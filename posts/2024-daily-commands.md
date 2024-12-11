---
tags: ["terminal", "github", "warp", "ohmyzsh"]
featured: false
description: "A preview of some of the tools I use in my terminal setup, as well as the commands I use on a daily basis when working with GitHub"
date: 2024-12-07T12:00:00
title: "My terminal setup and commands I use on a daily basis when working with GitHub"
slug: "terminal-commands-i-use-on-a-daily-basis"
author: "Curtis Timson"
image: "/post/daily-commands/daily-commands.png"
id: 1733579828812
---

When working on an application stored on GitHub, there are some commands which I use on a daily basis which help make me more efficient. This article shares with you some of these commands which I use.

## Setup

### Terminal Choice: Warp

I recommend [Warp Terminal](https://www.warp.dev/) as it provides some useful tooltips and pre-filling which makes writing commands more efficient.

### oh-my-zsh

I also use [oh-my-zsh](https://ohmyz.sh/) to help with features such as viewing the current git branch, and providing certain git aliases too, which are covered below.

### GitHub CLI

[GitHub CLI](https://cli.github.com/) is also a great tool I make use of for interacting with GitHub on features such as Pull Requests.

## Daily Commands

### Git Aliases

As mentioned above, `oh-my-zsh` provides a number of different Git alises. Below are some of the ones I use most frequently:

- `gl` - Alias for `git pull`
- `gc` - Alias for `git commit`
  - e.g `gc -m "my commit message"`
- `gp` - Alias for `git push`
- `gpsup` - Alias for `git push --set-upstream origin $(git_current_branch)`

There's also a lot more available via the link below:

https://kapeli.com/cheat_sheets/Oh-My-Zsh_Git.docset/Contents/Resources/Documents/index

### git add -p

`git add -p` allows you to preview your changes before adding to your next commit.

This is a really useful way of approving your changes one by one, and quickly selecting which should be added, without having to leave your terminal.

### Open Pull Request Alias

GitHub CLI has a handy command for opening the current branches Pull Request, or taking you to the creation form if one doesn't already exist:

```zsh
gh pr create --web
```

This in itself is already really useful, however I have an alias in my `.zshrc` file to make this slightly faster:

```zsh
alias pr="gh pr create --web"
```

This way I can simply run the command `pr` to open or create a new Pull Request for my current git branch.

----

Putting these together I can then quickly commit, push and open a pull request using the following:

```zsh
git add -p
gc -m "commit message"
gp
pr
```

-----

I hope these tips have been useful. Please feel free to leave any questions or comments.
