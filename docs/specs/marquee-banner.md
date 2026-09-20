# Spec: Animated marquee banner

Status: **implemented** · Branch: `banner-marquee-redesign`

Supersedes parts of [`content-page-heading-banner.md`](./content-page-heading-banner.md) — see
the note at the top of that file for exactly which.

## Objective

The `Hero` banner was a photograph of post-it notes (`public/images/cover.jpg`, 396 KB) served
as a `background-attachment: fixed` CSS background with hardcoded `image-set()` variant URLs.
It dated the site, and it was the last photographic asset on the critical path after #113 and
#114 cut everything else.

Replace it with a banner built from the blog's own content: marquee rows carrying every post
title and every tag, drifting over an animated colour field sampled from the photo it replaces.
The result should be unmistakably *this* site's banner rather than a generic gradient, and it
must not add meaningful client JavaScript to a site whose recent history is entirely payload
reduction.

### User stories

- As a reader landing on the homepage, I see what this blog is actually about — real post
  titles and real tags — before I read a single card.
- As a reader, I can stop a row by hovering it and click through to any title or tag in it.
- As the site owner, the banner stays current on its own: it is derived from the posts at build
  time, so publishing a post puts it in the banner with no extra work.

### Explicitly out of scope

- **Sticky navbar.** Raised during design and deliberately deferred to its own PR, including
  the question of whether `Header` should move into `layout.tsx` rather than being repeated
  across nine page files.
- **Touch parallax beyond pointer-drag.** `pointermove` only fires during a drag on touch, and
  device orientation needs a permission prompt on iOS. Not worth prompting for.
- **Per-page banner variety.** The layout is computed once at build time and is identical on
  every route; only the `/tag/*` highlight varies.

## Decisions taken (confirmed with the human before implementation)

| Question | Decision |
|---|---|
| Content of the rows | Post titles and tag names, as text. Rejected alternatives: a force-directed tag constellation (reused `/tags`' machinery but was 119 identical minimum-radius dots), and plain gradient blobs (generic). |
| Rendering | Server-rendered. Layout computed at build time. |
| Client JavaScript | Zero for rendering. One exception, approved explicitly after seeing it: a null-rendering pointer-parallax listener. |
| Are rows clickable? | **Every** row. An earlier design linked only the high-opacity middle rows to cap the anchor count; rejected as confusing once row counts dropped. |
| Palette | Sampled from `cover.jpg` — but with the lime **dropped**. |
| Field shape | Near-vertical bands with discrete stops, two layers crossing. Not blurred radial blobs. |
| Height | `268px`, matching the previous hero exactly. |
| Motion | Hover and `:focus-within` pause a row. |
| Avatar | Beside the site's own name only. |

## Assumptions

1. "Same colours as the post-its" tolerates dropping the lime. At any useful blur radius the
   lime sat beside the orange and red and the three averaged into brown — the human described
   the first attempt as "far too similar to Christmas". Every hue kept is a neighbour of the
   next on the wheel, which is what stops the blends muddying.
2. Repeated `href`s in the duplicated marquee track are harmless for SEO, being the same page's
   own links. They are `aria-hidden` and `tabindex="-1"`, so the accessibility tree and tab
   order see each once.
3. `getTopTags()` is used for its ordering, not to truncate: every tag appears. The
   recency-weighted `smartScore` order determines which row a tag is dealt to.

## Design notes

These are the decisions whose reasoning is not visible in the code, and which cost the most to
rediscover.

**Bands, not blobs.** Five blurred radial gradients at 90px averaged into brown-olive. The
reference the human cited (aihero.dev) uses a WebGL shader, but its field is structurally
*near-vertical bands in an analogous palette* — that, not the renderer, is what makes it read
as sharp. Reproducible in CSS.

**Double gradient stops.** A single-stop gradient interpolates across the whole width and reads
as one smooth wash. Holding each colour over a flat span lets `blur(18px)` turn the boundary
into a seam instead of a blend.

**Colour must reach both edges.** `.hero-bands` is inset `-20% -35%` so drift never exposes an
edge, which means the visible window is only its middle ~60%. A `transparent` end stop lands
*inside* that window and blacks out a third of the banner.

**Two layers.** One layer translating is a rigid block sliding sideways, which the eye reads as
static however far it travels. Their relative motion is what changes the colours.

**Perceptible travel.** The first attempt drifted ±4% over 140s — about 0.3px/second, below the
threshold at which motion registers at all.

**The duplicate track must be anchors.** The track scrolls to `-50%`, so for roughly half of
every cycle the duplicate *is* what is on screen. Rendering it as `<span>` made half the
marquee silently unclickable, and the faster tag rows reached that dead half almost twice as
quickly as the title rows — which presented as "tags never link, posts do".

**Hover cannot use a palette colour.** The background *is* the palette; amber text over the
amber band disappears. White on a dark chip holds contrast over any band. No ring: `box-shadow`
was not in the `transition` list, so it snapped in while the background was still fading.

**The title centres on the visible band.** `main .posts { margin-top: -48px }` rides the post
grid up over the bottom of the banner. `--hero-card-overlap` defaults to `0` and `Posts.scss`
raises it, next to the negative margin that causes it, so the two cannot drift apart — an
earlier version applied it to every full-height banner and mispositioned `/tags`, which renders
the tag graph rather than a grid.

**`.hero-panel` is a flex row.** Anything returned as a direct panel child lays out beside the
avatar, so the heading and subtitle must be wrapped in `.hero-text`.

## Project Structure

```
src/app/util/banner/buildRows.ts       → NEW: pure, DOM-free row layout
src/app/util/banner/buildRows.test.ts  → NEW
src/app/util/banner/getBannerRows.ts   → NEW: composes getPosts + getTopTags + buildRows
src/app/util/banner/index.ts           → NEW
src/app/components/BannerPointer.tsx   → NEW: the only 'use client' file in the banner
src/app/components/Hero.tsx            → rebuilt
src/app/components/Hero.scss           → rebuilt
src/app/components/Hero.test.tsx       → rebuilt
src/app/components/Posts/Posts.scss    → declares --hero-card-overlap
public/images/cover.jpg                → DELETED, nothing references it
src/app/types/Post.test.ts             → manifest fixture repointed to the OG image
src/app/util/images/urls.test.ts       → hardcoded-/_img guard reworked
```

No page file changes. All eight `Hero` call sites keep working untouched, because `Hero`
computes its own rows.

## Testing Strategy

| Level | What it covers |
|---|---|
| Unit (`buildRows.test.ts`) | Row counts, interleaving, round-robin dealing, direction alternation, opacity ramp symmetry and bounds, duration offsets, the single-row `bare` composition. |
| Component (`Hero.test.tsx`) | All variants; title and subtitle stacked inside `.hero-text`; avatar present on the site-title banner and absent elsewhere; every item in **both** runs is an anchor; duplicate run out of the tab order; hrefs exposed once; `/tag/*` highlight in both runs. |
| Build (`check:bundle`) | The client-JS budget, which `BannerPointer` must not breach. |
| Manual | `/`, `/cv`, `/tags`, `/uses`, `/tag/<tag>` in both themes. Pointer parallax cannot be driven by the browser-automation harness — `hover` does not dispatch `pointermove` — so it needs a real mouse. |

Two positioning bugs shipped past a green suite of 370 tests, so the structural assertions
above were written by confirming they **fail** against the previous component.

## Boundaries

**Always**
- Run `npm run lint`, `npx tsc --noEmit`, `npm run test:ci`, `npm run build` and
  `npm run check:bundle` before opening the PR.
- Check `/cv` and `/tags` visually, not just the homepage — both bugs above were invisible there.
- Keep the bottom border `4px solid var(--color-primary)`.
- Honour `prefers-reduced-motion` for every animated property added.

**Ask first**
- Adding any client JavaScript to the banner beyond `BannerPointer`.
- Changing the 268px height, or the variant heights.
- Reintroducing a raster image to the banner.

**Never**
- Let `Hero` or anything it imports pull `types/Post` across the client boundary — that puts
  marked and highlight.js in a browser chunk. See `scripts/check-client-bundle.mjs`.
- Render the duplicate marquee run as anything but anchors.
- Use a palette colour for the item hover state.

## Success Criteria

1. `/` renders `.hero` at 268px with 8 marquee rows, a frosted title panel and the avatar.
2. `/cv` renders `hero--compact`; heading and subtitle are stacked, not side by side.
3. `/uses` and `/privacy-policy` render `hero--bare` at 6rem: one tag row, no panel.
4. `/tags` renders the full-height banner with `--hero-card-overlap: 0`, since it has no grid.
5. `/tag/<tag>` marks that tag `hero-item--active` in both runs.
6. Every `.hero-item` in every run is an `<a>` with a valid `href`; the duplicate run is
   `aria-hidden` and `tabindex="-1"`, so each href reaches the a11y tree exactly once.
7. Hovering or focusing a row pauses it.
8. No stylesheet references `cover.jpg` and the file is gone.
9. `npm run check:bundle` passes within the 190 KB budget.
10. `npm run test:ci`, `npm run lint` and `npm run build` all pass.

## Deferred

- **Sticky navbar**, with the `Header`-into-`layout.tsx` question.
- **No tests for `getBannerRows` or `BannerPointer`.** The row-count and duration constants and
  the pointer clamp are currently unverified.
- **`--hero-card-overlap` uses `:has()`.** Browsers without it fall back to `0`, sitting the
  title 24px low on listing pages — degraded, not broken.
- **Stale generated variants.** `public/_img/images/cover-*` (10 files) remain on disk from
  before the source was deleted. Gitignored build output, absent from the manifest, and not
  recreated on a clean checkout.
