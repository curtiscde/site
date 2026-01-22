---
tags: ["london-marathon", "fundraising", "mapping", "leaflet", "project"]
description: "How I designed a fundraising website that maps donations directly onto a marathon route."
date: 2026-01-12T12:00:00
title: "Turning a Marathon Fundraiser into a Sponsorable Route"
slug: "turning-a-marathon-fundraiser-into-a-sponsorable-route"
author: "Curtis Timson"
image: "/post/2026/2026-london-marathon/london-marathon-curtis-site.png"
id: 1768247128063
---
Most marathon fundraising pages work the same way. You donate some money, a progress bar moves a little to the right, and your name gets added to a list. The total goes up, but your contribution quickly becomes indistinguishable from everyone else's.

Back when I first started preparing for the London Marathon a few years ago, I wanted a fundraising site where every donation had a visible, persistent effect. Something that donors could point to and say "that part is mine".

The idea I landed on was to treat the route itself as a fundraising interface. The course is split into segments, and donations claim pieces of it relative to their donation amount. As people give, the marathon route fills in section by section, with names and contributions attached to the specific parts.

I haven't seen this model used for a running race fundraiser before, and I deliberately leaned into that novelty in the hope it would encourage people to give more generously.

This post is a technical case study of this idea - from the early prototypes, to the way the route allocation, and finally the next steps I'm exploring.

![](/post/2026/2026-london-marathon/london-marathon-curtis-site.png)

## Defining the core requirements
Before thinking about implementation, I was clear on a small set of non-negotiable requirements:

### 1. Use an existing, trusted fundraising platform.
I didn't want to build a payment system.

Handling payments, donor data, and compliance correctly is a hard problem, and it's not where this project needed to be novel. Instead, the site integrates with the [JustGiving API](https://developer.justgiving.com/).

That choice was based on the following benefits:

- Donors are already familiar with the platform, which increases their confidence in donating
- Payments are handled securely without my system needing to touch card data
- Funds go directly to [Cancer Research UK](https://www.cancerresearchuk.org/), not via an intermediary account
- The API provides reliable access to donation data for visualisation

This let me focus entirely on the modelling and interaction, while delegating the hard financial problems to a system that already solves them well.

### 2. Make the route itself the interface

The marathon route needed to be more than a static visual. At a minimum, this meant the route needed to:

 - React to click interactions
 - Visually distinguish claimed sections from one another, and also unclaimed
 - Update incrementally as new donations arrived

### 3. The route must be clearly segmented

Finally, the segmentation itself had to be obvious.

Donors needed to be able to:

 - See where one sponsored section ends and another begins
 - Understand how much of the route a donation covered
 - Recognise continuity along the course as it filled in over time


## Early Prototype: Canvas API

![Early Prototype in HTML5 Canvas](/post/2026/2026-london-marathon/lm-canvas-img.png)

With those requirements in place, the first version of the map was built using [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API).

I started with a static image of the marathon course as the base map and drew a single polyline over the top to represent progress along the route. Even at that early stage, the visual idea worked. Seeing part of the course filled in immediately conveyed the concept more clearly than a progress bar could.

However, it became obvious that scaling this approach would be difficult. The route only existed as pixels on a canvas, and any interaction would have had to be custom-built on top. If the route was going to be interactive, segmentable, and stateful, it needed to be treated as data rather than something that was drawn onto a canvas.

That led to the move away from Canvas entirely.

