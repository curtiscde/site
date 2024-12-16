---
tags: ["typescript", "strava", "github-actions", "webhooks", "oauth2", "firebase", "nextjs"]
title: "Displaying Strava stats using webhooks & GitHub Actions"
description: "A recent project displaying Strava Year-To-Date stats using webhooks, Firebase, GitHub Actions & Next.js"
date: 2022-03-06T00:00:00
image: "/post/2022/2022-displaying-strava-stats-using-webhooks/stravaytd-w600.png"
slug: "displaying-strava-stats-using-webhooks"
id: 39
---
![](/post/2022/2022-displaying-strava-stats-using-webhooks/stravaytd-header.png)

At the start of this year myself and a few friends decided to challenge each other to see who could run the furthest by the end of 2022.

We use Strava to track our runs, and although they provide some features to show stats, I thought it would be great to be able to see these stats change over time, and also report on some other metrics (time, elevation & run count).

So I created an application which will retrieve our Strava stats, and periodically update this information on a webpage.

This article aims to explain high-level how this was achieved using a combination of Strava's API, GitHub Actions, and serverless functions.

![](/post/2022/2022-displaying-strava-stats-using-webhooks/screenshot.png)

## High-level Architecture

The application can be broken down into 3 main parts:

 - 🛂 User authorisation
 - 🏃‍♂️ Capture athlete stats after an activity
 - 📈 Daily update, build & deploy

![](/post/2022/2022-displaying-strava-stats-using-webhooks/stravaytd-diagram.png)


## 🛂 User Authorisation

In order for a user's activities to be tracked, they must first grant permission for the specific application to be able to access their Strava information.

Setting up a Strava application can be done via the settings section of the Strava website:

https://www.strava.com/settings/api

A user can then be sent a URL which looks like this:

> https://www.strava.com/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope=activity:read_all

![](/post/2022/2022-displaying-strava-stats-using-webhooks/authorize.png)


Once the user has authorised, Strava then redirects to the `redirect_uri`, passing with it a `code` query string.

This `code` value can then be used to obtain a `refresh_token` and `access_token`.

The `refresh_token` is encrypted and stored in the Firestore DB, and the `access_token` is used to obtain and store the initial Year-To-Date stats of the user.

Now the user has authorised access, the application will receive a webhook each time they complete a run.


## 🏃‍♂️ Capture athlete stats after an activity

When a user completes an activity, Strava will `POST` a webhook to the callback domain specified in the API settings. This will include information of the user (`owner_id`), and the activity also (`object_id`).

With this information we can look up the relevant `refresh_token` from Firestore, and use this as a trigger to obtain the latest stats of the user from the Strava API.

We can then post these stats to a [GitHub Action](https://github.com/features/actions) which will update the user's specific JSON file in the GitHub repository:

This is done using the `update-current-ytd.yml` workflow:

![](/post/2022/2022-displaying-strava-stats-using-webhooks/gh-action-update-ath-ytd.png)

With this in place, we now have JSON files updated for each athlete, containing their current Year-To-Date stats.

![](/post/2022/2022-displaying-strava-stats-using-webhooks/git-update-athlete.png)

## 📈 Daily update, build & deploy

With the above steps in place, we can now schedule a GitHub Action to run every day and record the stats at that time, to then be displayed on a graph.

This works by running a script which will obtain each of the user's stats, and push a new item into an array in the `ytdHistory.json` file. e.g:

```json
{
  "meta": { "lastUpdated": 1646270683333, "version": 25 },
  "athletes": [
    {
      "athleteId": 1,
      "ytd": [
        { "date": 1646270683333, "count": 7, "distance": 31016, "movingTime": 10375, "elevationGain": 95 }
      ]
    },
    {
      "athleteId": 2,
      "ytd": [
        { "date": 1646270683333, "count": 5, "distance": 30000, "movingTime": 5375, "elevationGain": 42 }
      ]
    }
  ]
}
```

The GitHub Action then commits and pushes this change to the repository.

![](/post/2022/2022-displaying-strava-stats-using-webhooks/git-update-ytd-history.png)

Next, this push triggers another pipeline at Netlify, which will then rebuild and deploy the application into the Production environment. Therefore, updating the graph with the latest stats.

![](/post/2022/2022-displaying-strava-stats-using-webhooks/netlify-build.png)


## 🌍 Demo & Code

The live application is available to view here:

 - Live App: https://stravaytd.curtiscode.dev

 - GitHub Repo: https://github.com/curtiscde/stravaytd




----

Any questions, or feedback, please feel free to leave them in the comments section below!