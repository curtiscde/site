# Spec: Move the post asset pipeline to build time

Status: **draft — awaiting review** · Branches: `perf/build-time-syntax-highlighting` (phase 1),
`perf/responsive-image-pipeline` (phase 2), `feat/article-image-lightbox` (phase 3)

Implements finding 01 of the September 2026 build audit, plus a requested lightbox feature that
depends on the same `marked` image renderer.

## Objective

Every page of curtiscode.dev currently ships a 978.3 KB JavaScript chunk
(`.next/static/chunks/3k_4dowe8ytjx.js`, 308.0 KB gzipped) whose only job is to redo, in the
reader's browser, work the build already had every opportunity to do: it is `highlight.js`,
re-colouring code on a statically exported site where every article's HTML is fixed at build time.

> **Correction (during implementation).** This spec originally said the chunk contained
> `highlight.js` **and** `marked`. It did not. The audit reached that conclusion from
> `grep -rl "marked"`, which matches the identifier `mip_markedonly` inside a highlight.js
> language grammar. Verified on `main`: the chunk contains one `marked` substring and it is that
> false positive. `marked` was never in a client bundle — SWC elides `import { Post }` when
> `Post` is only used in type position, so the barrel never pulled `types/Post.ts` in. The
> `import type` conversions below are therefore **hardening worth 0 bytes**, not a saving; the
> entire measured win is highlight.js. See "Cause A" for what they are still for.

Separately, `next.config.ts` sets `images: { unoptimized: true }`, which reduces `next/image` to a
bare `<img>`: no `srcset`, no `sizes`, no modern formats. `PostCard.tsx:16` therefore asks the
browser for a 1200x630 PNG and paints it into a 417px masonry column. Across the content set that
is **13.6 MB of cover images** (32 files, 435 KB average) and **28.6 MB of in-article images**
(69 files), all served at full size in their original format.

Success is: the reader gets byte-for-byte the same rendered article, having downloaded
dramatically less to get it, and the work moves to the one machine that is allowed to be slow —
the build.

### Phase 3 — the lightbox, and why it belongs here

Phase 2 shrinks in-article images so the reader downloads a width appropriate to the column.
That is a straight loss for anyone who wanted to *read* the screenshot — and most of these images
are screenshots of code, terminals and UIs, where detail is the point. A click-to-open modal
serving the untouched original is what makes phase 2's downsizing safe rather than lossy: small
by default, full resolution on demand, and the full-size bytes are fetched only when asked for.

It is specced here rather than separately because it consumes the same `marked` image renderer
phase 2 introduces — that renderer is what attaches the `data-full` attribute pointing at the
original.

### Why this is three phases

The three share a theme but almost nothing else — no shared dependencies, and only phase 3 has an
ordering preference. Phase 1 is a few hours and its effect is measurable with `grep`. Phase 2
introduces a build step, a dependency and 111 generated files. Phase 3 is reader-facing feature
work with its own risks (keyboard access, focus management). Three PRs, so a regression in one
cannot hold up the others.

Phase 3 is *technically* independent — delegation works against today's plain `<img>` tags — but
it is only worth much **after** phase 2, since before that the modal shows the same file already
on screen. Recommended order is 1 → 2 → 3; 3 can move earlier if a visible feature is wanted
sooner.

### User stories

- As a reader on a phone, I open an article and the code samples are already coloured when the
  first paint lands, instead of appearing black and restyling once ~300 KB of JavaScript has
  downloaded, parsed and run.
- As a reader on a metered connection, loading the homepage costs a few hundred KB of images
  rather than several MB, because I am sent images sized for the column they appear in.
- As the site owner, I stop paying bandwidth and Core Web Vitals penalties for work that a
  static site had no reason to defer to the client.
- As a reader who cannot make out the text in a screenshot of a terminal, I click it and get the
  full-resolution original in a modal, dismissed with Escape or a click outside.
- As a keyboard or screen-reader user, I can reach every enlargeable image with Tab, open it with
  Enter, move between the images in the article with the arrow keys, and land back where I was
  when I close it.
- As a hiring manager skimming the repo, the markdown pipeline reads as a deliberate build-time
  concern rather than something that leaked into the browser bundle by accident.

### Explicitly out of scope

- **Finding 02 (the RSC flight payload).** Phase 1 touches the same client boundary that finding
  02 is about, and it will incidentally shrink the payload, but reshaping `Post` into a
  `PostSummary` is a separate spec. This work must not start that refactor.
- **Finding 03 (SEO and craft signals).** The JSON-LD `useEffect` in `PostPage.tsx:47-57` is
  wrong and is being fixed — in its own PR, not this one. Phase 1 edits the same file; it must
  leave the JSON-LD effect exactly as it found it.
- **Replacing `masonic`.** Out of scope even though it is the reason `PostCard` renders in a
  417px column.
- **Re-authoring or re-shooting any image.** The files in `public/post/**` are the source of
  truth and are not edited, moved, renamed or deleted.
- **Animated GIFs** (5 files). Passed through untouched; sharp's animated-GIF handling is not
  worth the complexity for five images.
- **`next/image` outside post content** — `Header.tsx`, `Footer/Footer.tsx`,
  `cv/components/CompanyRow.tsx`. Unchanged in all three phases.
- **Lightbox on cover images** in `PostCard` / `RelatedPosts`. The card is a link to the post; a
  modal would fight it. In-article images only.
- **Zoom and pan inside the modal.** This is a lightbox, not an image viewer.

## Decisions taken (confirmed with the human before writing this spec)

| Question | Decision |
|---|---|
| One PR or two? | **Two.** One spec, two branches, phase 1 merges independently. |
| Image strategy | **Build-time `sharp` pipeline producing responsive AVIF + WebP variants.** Not a one-off committed conversion, and not a `sizes`-only tweak. |
| In-article images | **In scope.** A custom `marked` image renderer. These are the 28.6 MB — excluding them would leave the worst offenders untouched. |
| Click-to-enlarge modal | **In scope, as phase 3.** Serves the untouched original, fetched only on click. |
| Gallery navigation in the modal | **Yes.** 11 of the 20 image-bearing posts have 3+ images and three have 8-9, which is enough to justify prev/next. |
| Lightbox dependency | **None.** Native `<dialog>` + DaisyUI modal classes, matching the existing pattern in `Footer.tsx:78`. |
| Captions | **Show the markdown alt text as a visible `<figcaption>` on the page**, not only inside the modal, whenever the author supplied one. No caption when the alt is empty. |
| New dependency for highlighting | **No.** See "no `marked-highlight`" below. |
| `next/image` custom loader | **Dropped** (2026-09-07, reverses the original choice). A loader returns a single URL and so cannot offer AVIF *and* WebP. `<picture>` is used for both React and in-article images — one mechanism, better output. `images.unoptimized` stays `true`. Resolves open question 1. |
| Which images the prebuild processes | **All of `public/`** (116 files, 37.7 MB), not just `public/post/`. A uniform rule means nothing to remember when adding a post. |
| Encoder quality | **AVIF q65, WebP q80.** Measured, not guessed — see below. Resolves open questions 2 and 3. |

## Assumptions

1. **Rendered output is unchanged for the reader, with two deliberate exceptions**, both noted in
   success criteria. (a) More code blocks will be highlighted than before, because the current
   client-side setup registers only 4 of the 15 languages the posts actually use. (b) Phase 2
   adds a visible caption under any in-article image whose markdown supplies alt text — a new
   visual element, not a like-for-like migration.
2. `highlight.js` and `sharp` become **build-time-only** dependencies. The highlight.js *stylesheet*
   still ships — it is ~5 KB of CSS, not JavaScript, and it is what colours the pre-highlighted
   markup.
3. **Generated image variants are not committed.** They are produced into a gitignored directory
   by a `prebuild` step, so `public/post/**` stays the single source of truth and git history
   stays clean.
4. Netlify build time will rise. That is an acceptable trade for reader latency, and phase 2
   includes a manifest-based skip so the cost is paid once per changed image rather than once per
   build.
5. There is no visual-regression tooling in this repo. Verification is byte counts, `grep`
   assertions against `out/`, the existing Jest suite, and a manual pass over three specific
   posts.
6. `sharp@0.35.4` is already present transitively via `next`. Phase 2 promotes it to an explicit
   `devDependency` rather than relying on a transitive install.

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16.2.10, App Router, `output: 'export'` |
| Runtime | Node 22 (`.nvmrc`, `netlify.toml`, CI matrix) |
| Markdown | `marked@18.0.11` — renderers take **token objects**, e.g. `image({ href, title, text, tokens }: Tokens.Image)` |
| Highlighting | `highlight.js@11.11.1` |
| Images (phase 2) | `sharp@0.35.4`, promoted to an explicit devDependency |
| Tests | Jest 30 + Testing Library, jsdom, co-located `*.test.ts(x)` |
| Host | Netlify — `npm run build`, publish `out` |

## Commands

```bash
npm run dev                  # Dev server
npm run build                # Static export to out/ (phase 2: fires prebuild first)
npm run lint                 # eslint src
npm run test                 # Jest watch
npm run test:ci              # Jest with coverage — what CI runs
npx jest src/app/types/Post.test.ts    # Single file
```

Phase 2 adds:

```bash
npm run prebuild             # sharp variant generation (npm lifecycle: auto-runs before build)
npm run check:bundle         # Fails if hljs/marked reappear in a client chunk
```

`prebuild` is an npm lifecycle name, so `npm run build` triggers it automatically — Netlify needs
no change to `netlify.toml`.

## Project Structure

```
posts/{year}/                       Markdown source — not modified
public/post/{year}/{slug}/          Original images — not modified, source of truth
public/_img/                        NEW, gitignored. Generated AVIF/WebP variants
scripts/                            NEW. Build-time Node scripts (ESM, .mjs)
  generate-image-variants.mjs       sharp pipeline + manifest
  check-client-bundle.mjs           Regression guard for phase 1
src/app/types/Post.ts               transformPost — gains the code renderer
src/app/components/PostPage.tsx     Loses hljs; keeps the stylesheet import
src/app/components/PostImage.tsx    NEW (phase 2). <picture> wrapper
src/app/components/ArticleLightbox/ NEW (phase 3)
  ArticleLightbox.tsx               The <dialog>, matching the Footer.tsx pattern
  useArticleLightbox.ts             Delegated listener + open/close state
  ArticleLightbox.scss
docs/specs/                         This document
```

## Code Style

Existing conventions, observed from the repo: no semicolon discipline is enforced (both styles
appear), 2-space indent, named exports, arrow-function components typed inline. Match the file
being edited rather than imposing a global style.

### Phase 1 — the two root causes

**Cause A — a latent path from the client boundary to `marked`.** `PostPage.tsx` is `'use client'`
and does:

```ts
import { Post } from "../types";       // ← value import of the barrel
```

`src/app/types/index.ts` re-exports `postSchema`, a *value*, so on paper the barrel pulls in
`Post.ts`, which runs `marked.setOptions({ gfm: true })` at module scope.

**In practice it did not**, and the spec was wrong to say it did — see the correction in the
Objective. SWC drops an import whose bindings are only ever used as types, and `Post` is only ever
used as a type, so the barrel was elided and `marked` stayed out of the client graph.

The conversion is still worth making, for one reason that is not about bytes: the invariant is
currently held by a compiler optimisation nobody wrote down. The day someone uses `postSchema`, or
`Post` in a value position, in anything reachable from `'use client'`, a 40 KB markdown renderer
joins the bundle silently. `import type` states the constraint, and
`scripts/check-client-bundle.mjs` enforces it. Expected saving: **zero bytes.** Expected value:
the next person cannot break it by accident.

`postSchema` has exactly one consumer — `getPosts.ts:36`, which is server-only (it uses `fs`).
So the fix is to make every client-reachable import type-only:

```ts
import type { Post } from "../types";  // erased at compile time
```

Applies to: `PostPage.tsx:3`, `Posts/Posts.tsx:4`, `MasonryPosts.tsx:4`, `PostCard.tsx:3`,
`RelatedPosts.tsx:1`, `Footer/Footer.tsx:4`, and `tagGraph/TagGraph.tsx:15`.

**Cause B — the highlighter runs in the browser.** `PostPage.tsx:5-9` imports `hljs` and four
languages at module scope, registers them, then highlights in an effect (`:39-43`). Delete all of
it — including the `useEffect` — and keep only:

```ts
import 'highlight.js/styles/atom-one-dark.css';   // CSS only, no JS
```

Highlighting moves into `transformPost`, where the HTML is produced:

```ts
import hljs from 'highlight.js';

// Posts were authored across a decade of tooling, so fences carry Prism-era
// names alongside hljs ones. Normalise before lookup.
const LANGUAGE_ALIASES: Record<string, string> = {
  markup: 'xml',
  clike: 'c',
  zsh: 'bash',
  md: 'markdown',
};

marked.use({
  renderer: {
    code({ text, lang }) {
      // marked hands back the whole info string; today every fence in posts/ is a
      // bare language, but take the first token so a future ```js title="x" works.
      const name = lang?.trim().split(/\s+/)[0] ?? '';
      const language = LANGUAGE_ALIASES[name] ?? name;
      const isKnown = language !== '' && hljs.getLanguage(language) != null;
      const highlighted = isKnown
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value;
      const className = isKnown ? `hljs language-${language}` : 'hljs';
      return `<pre><code class="${className}">${highlighted}</code></pre>`;
    },
  },
});
```

The `hljs` class must sit on the `<code>` element — that is the selector
`atom-one-dark.css` uses for its background and default foreground.

**Why no `marked-highlight`.** It is a thin adapter that would earn its place if we had no other
custom renderers. Phase 2 adds an `image` renderer to the same `marked.use()` call, so a second
mechanism for the same job would be noise. A dependency that saves twelve lines and forces a
compatibility check against `marked@18` is not worth adding.

**Correction, found during implementation.** The spec originally asserted that
`transpilePackages: ['marked']` was dead config once the leak was closed, and proposed deleting it
as a self-verifying test. That was wrong. The *build* does not need it — verified, `npm run build`
succeeds without it — but **`next/jest` derives its `transformIgnorePatterns` from it**, and
`marked` publishes ESM only (its `exports` map resolves to `marked.esm.js`; the UMD build exists
but pointing tests at it would exercise a different artifact than production). Deleting the entry
therefore breaks every suite that touches `types/Post.ts`.

The entry stays, with a comment recording that it serves the test runner and not the browser.
`scripts/check-client-bundle.mjs` is what actually proves marked left the client bundle, which is
the assertion that mattered.

A third leak path also turned up that this spec had missed: `TagGraph.tsx:15` value-imports the
`util/graph` barrel, which exports `buildGraph`, which imports the types barrel — reaching
`Post.ts` from `'use client'` a third way. It is in the conversion set.

### Phase 2 — image variants

```js
// scripts/generate-image-variants.mjs
const WIDTHS = [400, 800, 1200];
const FORMATS = [
  ['avif', { quality: 65 }],
  ['webp', { quality: 80 }],
];
```

**Why these qualities.** The original spec guessed q55/q78 and flagged text-heavy screenshots as a
risk needing a case-by-case eyeball. Measuring the three largest sources removed the question: at
1400w the reduction is 96-98% *even at q80*, so buying artefact-safety on UI screenshots costs
almost nothing in absolute bytes.

| source | original | AVIF q80 | WebP q80 |
|---|---:|---:|---:|
| `2026-london-marathon/london-marathon-curtis-site.png` | 4,776 KB | 194 KB | **136 KB** |
| `2026-london-marathon/leaflet.png` | 1,832 KB | 73 KB | **45 KB** |
| `2017-lischana-lane-photography/lischana-lane-portfolio.png` | 1,708 KB | 42 KB | **29 KB** |

Note WebP *beats* AVIF at this quality on flat UI screenshots. Both formats are emitted and the
browser picks the first it supports, so the `<source>` order matters: AVIF wins on photographs,
WebP on screenshots, and neither is universally smaller. This also settles open question 3 --
`/post/2026-london-marathon` is screenshots like everything else and needs no special handling.

Never upscale: skip any width at or above the source's intrinsic width. Write a manifest keyed by
source path with `{ mtimeMs, size, width, height }` so unchanged images are skipped on rebuild,
and so intrinsic dimensions are available to the renderer without re-reading each file.

Both consumers emit the same markup shape. `PostImage.tsx` for React:

```tsx
<figure>
  <picture>
    <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
    <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
    <img src={src} alt={alt} width={width} height={height}
         data-full={original} loading="lazy" decoding="async" />
  </picture>
  {alt !== '' && <figcaption aria-hidden="true">{alt}</figcaption>}
</figure>
```

**Captions.** The caption text is the markdown alt text — the `alt` in `![alt](/path/image.png)`.
48 of the 69 in-article images supply one and 21 do not, so the caption is conditional: no alt,
no `<figcaption>`, and the `<figure>` still wraps the image for consistent styling.

The existing alt text is short and label-like — "Jest Pass Output", "Minimap Example", "Little
Bobby Tables" — which is why it works as a visible caption with no rewriting. 22 of the 48 restate
the filename (`file-icons.png` → "File Icons"); that is fine and is **not** filtered, because it
still reads correctly under an image.

`aria-hidden="true"` on the `<figcaption>` is deliberate. The string is already announced as the
image's `alt`, so exposing it twice would make a screen reader read every caption in duplicate.
Sighted readers get the caption; assistive tech gets it once, via `alt`.

and a `marked` `image` renderer producing the identical structure as a string for in-article
images. `width`/`height` come from the manifest and are always present — they are what prevents
layout shift, which is half the point. `data-full` points at the untouched original in
`public/post/**` and is what phase 3's lightbox opens; it costs nothing until clicked.

**Unknown or unprocessed sources** (GIFs, SVGs, anything sharp could not read) fall through to a
plain `<img>` with the original `src`. A missing variant degrades; it never breaks a page.

### Phase 3 — the lightbox

The constraint that shapes everything: **in-article images are not React**. `PostPage.tsx:63`
injects the rendered article with `dangerouslySetInnerHTML`, so those images exist only as HTML.
The lightbox works by **event delegation on the article container**, never by rendering a
component per image.

The repo already has the pattern to match — `Footer.tsx:78` uses a native
`<dialog className="modal">` with DaisyUI 4 modal classes and `<form method="dialog">` for
dismissal. Native `<dialog>` gives Escape-to-close, focus trapping and background inertness for
free, which is why this needs no dependency.

```ts
const onClick = (e: MouseEvent) => {
  const img = (e.target as HTMLElement).closest('img');
  if (img == null || !container.contains(img)) return;
  // 2017-moving-wordpress-hugo links its xkcd image out to xkcd.com. Leave links alone.
  if (img.closest('a') != null) return;
  e.preventDefault();
  open(images.indexOf(img));
};
```

Eligible images get their affordance **on mount, from JavaScript** — so that without JavaScript
the article renders exactly as it does today, advertising no control semantics for a control that
would not work:

```ts
img.tabIndex = 0;
img.setAttribute('role', 'button');
img.setAttribute('aria-label', `View full size: ${img.alt || 'image'}`);
```

Source resolution is the seam between phases 2 and 3:

```ts
const fullSrc = img.dataset.full ?? img.currentSrc ?? img.src;
```

Phase 2's `image` renderer sets `data-full` to the untouched original under `public/post/**`. The
fallback means phase 3 still works if it ships first — the modal just shows the file already on
screen.

On open, the already-decoded inline image is displayed scaled up as an instant placeholder and
swapped for the original once that decodes. **The original is requested on click and never
before** — that is the bargain that lets phase 2 downsize aggressively.

Arrow keys and on-screen prev/next move between an article's images; the controls are hidden when
there is only one.

**The cost, stated plainly:** this adds client JavaScript to a site whose headline problem is
client JavaScript. The budget is **2 KB gzipped and no new dependency**. Set against the ~308 KB
phase 1 removes, it is noise — but the budget is a success criterion, not an aspiration.

## Testing Strategy

Jest 30 + Testing Library, jsdom, co-located with source. `npm run test:ci` runs in CI with
coverage; coverage must not fall.

**Phase 1**

| Level | What |
|---|---|
| Unit — `src/app/types/Post.test.ts` | `transformPost` emits `<pre><code class="hljs language-js">` with `hljs-` spans for a js fence; maps `markup` → `xml` and `clike` → `c`; falls back to `highlightAuto` for an unknown language; never throws on a fence with no language. |
| Unit — `src/app/components/PostPage.test.tsx` | Existing JSON-LD tests still pass unchanged. Add: `contentHtml` is rendered verbatim and no highlighting effect mutates the DOM after mount. |
| Build assertion — `scripts/check-client-bundle.mjs` | `grep`-equivalent over `.next/static/chunks/*.js` for `hljs` and `marked`. Non-zero exit on a hit. Runs in CI after `npm run build`. |
| Manual | `/post/2026-tech-stack-snapshot` (js), a post with an `html` fence, and one with a bare fence. Disable JavaScript entirely — code must still be coloured. |

**Phase 2**

| Level | What |
|---|---|
| Unit | Variant path derivation and srcset construction, from a fixture manifest. No sharp invocation in Jest. |
| Unit | `marked` image renderer: emits `<picture>` with both `<source>` types and explicit `width`/`height`; falls back to plain `<img>` for a GIF and for a source absent from the manifest. |
| Unit — captions | `![Jest Pass Output](/x.png)` emits a `<figcaption aria-hidden="true">` with that text; `![](/x.png)` emits a `<figure>` with **no** `<figcaption>`; alt containing markdown characters or quotes is escaped, not injected raw. |
| Component | `PostImage` renders the `alt`, both sources, the dimensions, and a caption only when `alt` is non-empty. |
| Build assertion | After `npm run build`, no HTML in `out/` references an original `.png` cover in an `<img src>` where a variant exists. |
| Manual | Homepage and one image-heavy article in DevTools: confirm AVIF is served, confirm the transferred size for the masonry grid, confirm CLS is unchanged or better. |

**Phase 3**

| Level | What |
|---|---|
| Unit — `useArticleLightbox` | Ignores clicks that miss an image; ignores an image inside an `<a>`; resolves `data-full` in preference to `src`; wraps around at both ends of the gallery. |
| Component — `ArticleLightbox` | Opens on image click, closes on Escape, on backdrop click and on the close button; returns focus to the clicked image; hides prev/next when the article has one image. |
| Component — a11y | Every eligible image gains `tabindex`, `role="button"` and an `aria-label` derived from its `alt`; Enter and Space open the modal. |
| Component — caption | The modal shows the caption when the image has alt text and reserves no space for it when it does not. |
| Component — regression | Given article HTML containing the linked xkcd image, no `role="button"` is applied and a click is not intercepted. |
| Build assertion | `check:bundle` budget: the post-page client bundle grows by under 2 KB gzipped against the phase 2 baseline. |
| Manual | `/post/2017-8-useful-atom-packages` (9 images): open DevTools with an empty cache, confirm **no original is requested until a click**, then walk the gallery with the arrow keys alone. Repeat with JavaScript disabled and confirm the article is untouched. |

The regression this suite exists to catch is a future `'use client'` component value-importing
`Post.ts` and silently restoring the 978 KB chunk. That is what `check:bundle` is for, and it is
the one new test that must run in CI rather than locally.

## Boundaries

**Always**
- Run `npm run lint`, `npm run build` and `npm run test:ci` before opening either PR.
- Keep `public/post/**` byte-identical. Originals are the source of truth.
- Re-measure after each phase and put real numbers in the PR description — no estimates.
- Preserve the existing `alt` text on every image — phase 3 derives its `aria-label` from it.

**Ask first**
- Adding any runtime dependency (`sharp` as a *devDependency* is pre-approved by this spec; a
  runtime dep is not).
- Changing `netlify.toml`, `ci.yml`, or the Node version.
- Any change to `posts/**` markdown or to frontmatter `image:` paths.
- Deviating from the `<picture>` approach in a way that changes rendered HTML for readers.

**Never**
- Delete, move, rename or re-encode a file under `public/post/**`.
- Commit generated image variants.
- Touch the JSON-LD effect or the theme system — those belong to finding 03.
- Add a lightbox/carousel library. Native `<dialog>` and DaisyUI classes only.
- Apply control semantics (`role`, `tabindex`) to images in server-rendered HTML — the affordance
  must only exist when the JavaScript that backs it is running.
- Weaken or delete a failing test to make the build pass.
- Start the `PostSummary` refactor from finding 02.

## Success Criteria

**Phase 1** — all objectively checkable:

1. `hljs` appears in **0** files under `.next/static/chunks/*.js`. Baseline: 1. ✅
2. ~~`marked` returns 0 files, baseline 1~~ — **baseline was wrong, see the correction in the
   Objective.** `marked` was never bundled, so this can only ever be a forward-looking guard.
   Restated: `scripts/check-client-bundle.mjs` detects a planted copy of `marked.esm.js` (verified
   by copying it into a fixture chunk dir) and passes on this branch. ✅
3. The chunk `3k_4dowe8ytjx.js` (978.3 KB raw / 308.0 KB gzip) no longer exists, and total
   JavaScript requested by a `/post/*` page falls by **at least 900 KB raw / 300 KB gzip**.
4. ~~`transpilePackages` is gone from `next.config.ts`~~ — **withdrawn**, see the correction under
   Code Style. Replaced by: `scripts/check-client-bundle.mjs` exits non-zero when `marked` or
   `hljs` appears in any file under `.next/static/chunks/`, and passes on this branch.
5. Every `<pre><code>` in `out/post/*.html` carries an `hljs` class and at least one `hljs-`
   span — with JavaScript disabled. **This is a net improvement, not parity:** posts use 15
   distinct fence languages (72 `js`, 36 `html`, 10 `css`, 9 `bash`, plus 11 more) and today only
   4 are registered, so the 36 `html` blocks currently render unhighlighted.
6. `npm run test:ci` passes; coverage does not fall.

**Phase 2**

7. Cover images requested by the homepage drop from the current **13.6 MB** of originals to
   **under 1.5 MB** transferred, measured in DevTools with an empty cache.
8. Every in-article image resolves to an AVIF or WebP variant where one exists; the 69 in-article
   images total **28.6 MB** today.
9. Every generated `<img>` carries explicit `width` and `height`; CLS on the homepage and on one
   image-heavy article is no worse than the current measurement. Captions must not introduce
   layout shift — they are in normal flow beneath a dimensioned image.
9a. The 48 in-article images with markdown alt text render a visible `<figcaption>`; the 21
    without render a `<figure>` with none. No caption is announced twice by a screen reader.
10. `public/post/**` is byte-identical to `main`, and `git status` shows no generated variant.
11. A second consecutive `npm run build` skips all image work via the manifest and adds under 2s.

**Phase 3**

12. Clicking an in-article image opens a modal showing the **original** from `public/post/**`.
    Escape, a backdrop click and the close button all dismiss it, and focus returns to the image
    that was clicked.
13. Keyboard only: Tab reaches every eligible image, Enter and Space open the modal, Left/Right
    move between the article's images, Escape closes.
14. The xkcd image in `2017-moving-wordpress-hugo` still navigates to xkcd.com and does **not**
    open the modal.
15. With JavaScript disabled, articles render byte-identically to before — no pointer cursor, no
    `role="button"`, no `tabindex`.
16. **No original image is requested before a click.** Verified with an empty cache on
    `/post/2017-8-useful-atom-packages`, which has 9 images.
17. Phase 3 adds **under 2 KB gzipped** to the post-page bundle and **no new dependency**.

## Deferred

- **Netlify build cache for `public/_img/`.** Without it, every Netlify build regenerates all
  variants from scratch — the manifest only helps locally. Worth adding once we have measured
  what a cold generation actually costs; premature before that.
- **A `server-only` import guard on `Post.ts`.** A stronger guarantee than `check:bundle`, but it
  needs a new dependency and the CI check catches the same regression. Revisit if it ever fires.
- **Consolidating `getMarkdownContent.ts`** (`src/app/util/`) onto the same configured `marked`
  instance. It renders `/uses` and `/privacy-policy`, has no code fences and no images, so it
  gains nothing here.
- **Pinch-zoom, scroll-zoom and pan inside the lightbox.** Deliberately excluded; the modal shows
  the original at its natural size within the viewport and nothing more.
- **Swipe gestures** for gallery navigation on touch devices. Arrow keys and on-screen controls
  ship first; add swipe only if it is actually missed.
- **Deep-linking to an open image** (e.g. `#image-3`), which would make a specific screenshot
  shareable.
- **`sizes` tuning per breakpoint.** Phase 2 ships one reasonable `sizes` value; measuring the
  masonry breakpoints properly is a follow-up.

## Open Questions

All three are resolved as of 2026-09-07, before phase 2 began. Kept here with their answers rather
than deleted, so the reasoning survives.

1. ~~**`next/image` custom loader, or drop `next/image` for post images?**~~ **Resolved: drop the
   loader.** A custom loader returns a single URL, so it can produce a multi-width `srcset` in one
   format but cannot offer AVIF *and* WebP. In-article images need `<picture>` regardless, since
   they come from a `marked` renderer rather than React. A loader would have meant two mechanisms
   for one job, with the React path losing AVIF. `<picture>` is now used for both;
   `images.unoptimized` stays `true` and no `loaderFile` is added.
2. ~~**AVIF quality floor.**~~ **Resolved: no floor needed, q65 AVIF / q80 WebP throughout.**
   Measurement showed the savings are 96-98% even at q80, so there is no tension between file size
   and artefacts on text-heavy screenshots. The proposed "eyeball the three worst cases" step is
   dropped as unnecessary.
3. ~~**Does `/post/2026-london-marathon` need special handling?**~~ **Resolved: no.** Both large
   images are UI screenshots, not photographs; the 4,996 KB cover encodes to 136 KB WebP at 1400w
   under the standard settings.

---

*Gate: this spec is Phase 1 (Specify) of the spec-driven workflow. Plan and Tasks follow once
this document is approved.*
