---
tags: ["github-actions", "readme", "rss"]
title: "Displaying latest posts on your GitHub profile"
description: "GitHub now has the option of adding a README to your profile page, which can be updated with your latest blog posts"
date: 2022-04-04T00:00:00
image: "/post/2022/2022-github-profile-latest-posts/cover-latest-posts-600w.png"
slug: "github-profile-latest-posts"
id: 41
---
GitHub now has the option of adding a README to your profile page, which can be used to display information about your work and interests, as well as contributions you're proud of.

GitHub have provided a comprehesive guide on how to set up your profile README here:

https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme

![](/post/2022/2022-github-profile-latest-posts/add-profile-repo.png)

## Using GitHub Actions to display latest posts

What is great about this setup is that we can programatically update the content, as we can do with any other repo file.

Therefore, we can also add workflows to handle programmatic updates.

One such GitHub Action, [blog-post-workflow](https://github.com/gautamkrishnar/blog-post-workflow), takes an RSS feed input and periodically updates your README with the contents of this feed.

### Add placeholder to README

Before the GitHub Action can work correctly, we must first update the README to include a placeholder area for where the posts should be injected on each run:

```md
#### 📝 Latest Blog Posts
<!-- BLOG-POST-LIST:START -->
<!-- BLOG-POST-LIST:END -->
```

### Add workflow

Under the folder structure `.github/workflows`, create a new file called `blog-post-workflow.yml` (file name can be something different if you prefer), and add the following contents, ensuring that you update the `feed_list` property to that of your RSS feed URL:

```yaml
name: Latest Blog Posts
on:
  schedule:
    - cron: '0 * * * *' # Runs every hour
  workflow_dispatch:

jobs:
  update-readme-with-blog-posts:
    name: Update README with latest blog posts
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Pull in latest blog posts
        uses: gautamkrishnar/blog-post-workflow@master
        with:
          feed_list: "https://myrssfeedurlhere"
```

Although the cron job example above runs every hour, you can increase or decrease this frequency. I personally have opted to only update this once a week using `cron: '0 0 * * 0'`. The `workflow_dispatch` property being in place also means it's possible to manually run this action from the GitHub UI.

Once the GitHub Action runs, the posts will then appear on your README profile:

![](/post/2022/2022-github-profile-latest-posts/latest-posts.png)

If you have any issues or questions specifically around the GitHub Action, there is great documentation over on the repository page:

https://github.com/gautamkrishnar/blog-post-workflow