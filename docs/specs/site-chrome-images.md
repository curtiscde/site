# Spec: Responsive variants for site chrome images

Status: **specified** · Branch: `perf/site-chrome-images`

## Objective

`docs/specs/post-asset-pipeline.md` moved every image in post content onto a build-time
AVIF/WebP pipeline, and explicitly left `next/image` outside post content alone — `Header.tsx`,
`Footer/Footer.tsx` and `cv/components/CompanyRow.tsx`, "unchanged in all three phases". That
exception is now the largest remaining image cost on the site.

`next.config.ts` sets `images: { unoptimized: true }`, which reduces `next/image` to a bare
`<img>`: no `srcset`, no `sizes`, no modern formats. So the avatar renders at its full 600×600,
347.1 KB, into a **40×40** slot:

| call site | file | original | native | rendered at |
|---|---|---:|---|---|
| `Header.tsx:14` | `/images/curtis.png` | **347.1 KB** | 600×600 | 40×40 |
| `Footer.tsx:68` | `/images/curtis.png` | **347.1 KB** | 600×600 | 40×40 |
| `CompanyRow.tsx:56` | `/images/logos/next.png` | 35.5 KB | 3840×926 | 56×56 tile |
| `CompanyRow.tsx:56` | `/images/logos/dreamscape.jpeg` | 3.5 KB | 200×200 | 56×56 tile |
| `CompanyRow.tsx:56` | `/images/logos/tesco.svg` | 2.6 KB | vector | 56×56 tile |
| `CompanyRow.tsx:56` | `/images/logos/whitbread.svg` | 6.5 KB | vector | 56×56 tile |

`Header` and `Footer` both live in the layout, so the avatar loads on **every one of the 203
generated pages**, and twice on an article page. After #113 cut the homepage document to 13.4 KB
over the wire, this single 40×40 avatar is **26× larger than the entire HTML of the page it sits
on**.

Success is: the same rendered chrome, with the avatar costing single-digit kilobytes instead of
347, and the `next/image` exception closed out entirely.

### Why the widths ladder has to change

The generator's `WIDTHS` is `[400, 800, 1200, 1600]` — sized for an article column, and the
smallest rung is 10× the avatar's slot. Reusing it would take the avatar to 10.9 KB, a 97% win,
but would still send a 400px file to a 40px box. Measured at candidate widths:

| width | AVIF | WebP |
|---:|---:|---:|
| 80w | 1.4 KB | 1.2 KB |
| **96w** | **1.8 KB** | **1.4 KB** |
| 120w | 2.3 KB | 2.0 KB |
| **200w** | **4.2 KB** | **3.9 KB** |
| 400w (smallest today) | 10.9 KB | 10.2 KB |

Adding `96` and `200` takes the avatar to **1.8 KB** — 9.1 KB better than reusing 400w, on every
page load, against a document that is now 13.4 KB. The same rungs take `next.png` from 2.1 KB to
roughly 1.1 KB at the 112px it actually needs.

### User stories

- As a reader on a metered connection, the first page I open costs me a few kilobytes of chrome
  rather than a third of a megabyte for a thumbnail of someone's face.
- As a reader on a slow link, the header avatar is not the largest single asset on the page.
- As the site owner, the image pipeline covers every image on the site, so there is no second
  category to remember when adding one.
- As a maintainer, the fallback for an SVG or an unprocessable file is the same one the article
  pipeline already uses, not a special case.

### Explicitly out of scope

- **The two SVG logos.** `tesco.svg` and `whitbread.svg` are vector, already small, and sharp's
  SVG rasterisation would make them *worse*. They keep rendering as-is and must be byte-identical.
- **Re-authoring, re-cropping or replacing any source image.** `/images/curtis.png` stays 600×600
  at 347.1 KB on disk; only what is *served* changes.
- **Removing `next/image` from the project.** This spec removes its last three call sites, but
  the dependency stays — it is part of Next.js.
- **Gravatar and other remote images.** The favicon and `rel=me` link point at gravatar.com;
  remote images cannot be processed by a build-time pipeline and are untouched.
- **The `sizes` tuning follow-up** deferred by the asset-pipeline spec. This spec sets `sizes` for
  three fixed-size slots, which is a different and much simpler problem than the masonry grid.
- **Finding 03 (the JSON-LD `useEffect`).** Still open, still its own PR.

## Decisions taken (confirmed with the human before writing this spec)

| Question | Decision |
|---|---|
| Widths ladder | **Add `96` and `200` to `WIDTHS`.** Measured, not guessed — see the table above. Takes the avatar to 1.8 KB rather than 10.9 KB. |
| Scope | **Avatar *and* the CV logos.** All three `next/image` call sites outside post content, closing the exception in one PR rather than leaving `CompanyRow` for later. |
| SVG logos | **Untouched.** Vector; nothing to gain and rasterising would lose quality. |
| Markup | **`<picture>`, via the existing `PostImage`.** Same component the cover images use, so there is one mechanism on the site, not two. |

## Assumptions

1. **Rendered output is visually unchanged.** The avatar and logos occupy the same boxes at the
   same sizes. The only difference a reader could notice is that they appear sooner.
2. **Changing `WIDTHS` regenerates everything.** `CONFIG_HASH` is a hash of `[WIDTHS, MAX_WIDTH,
   FORMATS]`, so adding rungs invalidates all 111 cached entries — by design, and the reason that
   hash exists. Expect one ~40s cold generation, then 0.2s warm as before.
3. **The extra rungs are harmless to articles.** In-article images declare
   `sizes="(max-width: 768px) 100vw, 720px"`, so a browser never selects a 96w or 200w candidate
   for them. The cost is generation time and gitignored disk, not reader bytes.
4. **`targetWidths` already handles small sources correctly.** It filters rungs below the native
   width and always ends at the source's own width, so `dreamscape.jpeg` (200×200) yields
   `[96, 200]` rather than a lone upscale.
5. **No new dependency.** `sharp` is already a devDependency; `PostImage` already exists.

## Tech Stack

Unchanged. Next.js 16 App Router with `output: 'export'`, `sharp@0.35.4` at build time via
`scripts/generate-image-variants.mjs`, Jest 30 + Testing Library.

## Commands

```bash
npm run images        # regenerate variants (prebuild runs it automatically)
npm run dev
npm run lint
npm run test:ci
npm run build
npm run check:bundle
```

## Project Structure

```
scripts/generate-image-variants.mjs   WIDTHS gains 96 and 200
src/app/util/images/
  manifest.ts                         unchanged
  resolve.ts                          NEW — shared manifest lookup (moved off types/Post.ts)
  picture.ts, urls.ts                 unchanged
src/app/components/
  SiteImage.tsx                       NEW — server component: resolve + render PostImage
  PostImage.tsx                       unchanged
  Header.tsx                          next/image -> SiteImage
  Footer/Footer.tsx                   next/image -> PostImage, variants passed in as a prop
src/app/cv/components/CompanyRow.tsx  next/image -> SiteImage
src/app/layout.tsx                    resolves the avatar once, passes it to Footer
```

## Implementation

### The one structural wrinkle: `Footer` is a client component

`Header.tsx` and `CompanyRow.tsx` are server components and can read the build-time manifest from
disk directly. **`Footer/Footer.tsx` is `'use client'`** and cannot — the same constraint that
`PostCard` hit in phase 2, and it gets the same answer: the data travels as a prop.

`layout.tsx` is a server component and already renders `<Footer>`, so it resolves the avatar once
and passes it down, exactly as the listing pages pass `imageThumbnail`.

### Extract the manifest lookup

`types/Post.ts:83` has `resolveCoverImage`, which is a general "look this src up in the manifest
and return `{width, height, widths}`" function that happens to live in the post module. Move it to
`util/images/resolve.ts` as `resolveImage`, re-export it, and have `types/Post.ts` use it. That is
a straight extraction — no behaviour change — and it stops a third copy appearing.

### `SiteImage`

A thin server component so the two server call sites do not each repeat the lookup:

```tsx
export const SiteImage = ({ src, alt, sizes, className, priority }: SiteImageProps) => (
  <PostImage src={src} alt={alt} sizes={sizes} variants={resolveImage(src)} className={className} priority={priority} />
)
```

`PostImage` already degrades to a plain `<img>` when there are no variants, which is exactly what
the two SVG logos need — no special case, no branch to write.

### `sizes` values

Fixed-size slots, so these are exact rather than estimated:

| call site | `sizes` | why |
|---|---|---|
| Header avatar | `40px` | `w-10` on the avatar wrapper |
| Footer avatar | `40px` | same |
| CV logo tile | `56px` | `w-14 h-14` on `.cv-logo-tile` |

The header avatar is above the fold on every page, so it takes `priority` and loads eagerly. The
footer and CV logos stay lazy.

## Testing Strategy

| Level | What |
|---|---|
| Unit — `resolve.test.ts` | Returns `undefined` for an unknown src and for `undefined`; returns `{width, height, widths}` for a real manifest entry; returns empty `widths` for a measured-but-not-encoded entry. Guarded by the same skip-when-no-manifest pattern as `urls.test.ts`. |
| Unit — `targetWidths.test.ts` | Extend the existing cases for the new rungs: `targetWidths(600)` is `[96, 200, 400, 600]`; `targetWidths(200)` is `[96, 200]`; `targetWidths(80)` is `[80]` and never upscales. |
| Component — `SiteImage` | Renders a `<picture>` with both source types for an image in the manifest; degrades to a plain `<img>` of the original for an SVG; passes `sizes` through. |
| Component — `Header` | Renders the avatar as a `<picture>`, never `src="/images/curtis.png"`; keeps its existing alt text and its link to `/`. |
| Component — `Footer` | Renders the avatar from the `variants` prop; still renders correctly when the prop is absent (a build with no manifest). Existing Footer tests must keep passing unchanged. |
| Component — `CompanyRow` | Existing tests use the two SVG logos and must pass untouched; add one case for a raster logo emitting `<picture>`. |
| Build assertion — `check:bundle` | No page in `out/` references `/images/curtis.png` in an `<img src>`. This is the assertion that actually catches a regression, since the component types will not. |
| Manual | `/`, `/cv` and one article in DevTools with an empty cache: confirm the avatar is fetched as AVIF at ~2 KB, confirm the CV tiles still render, confirm the two SVGs are byte-identical. |

## Boundaries

**Always**

- Run `npm run lint`, `npx tsc --noEmit`, `npm run test:ci`, `npm run build` and
  `npm run check:bundle` before opening the PR.
- Re-measure and put real numbers in the PR description — no estimates.
- Keep `public/images/**` byte-identical. Originals are the source of truth.

**Ask first**

- Adding any runtime dependency.
- Changing `netlify.toml`, `ci.yml` or the Node version.
- Any change to `MAX_WIDTH`, the encoder qualities, or the formats emitted — this spec changes
  `WIDTHS` only.
- Rasterising or replacing an SVG.

**Never**

- Delete, move, rename or re-encode a file under `public/images/**`.
- Commit generated variants.
- Touch the JSON-LD effect — that belongs to finding 03.
- Weaken or delete a failing test to make the build pass.

## Success Criteria

1. `/images/curtis.png` appears in **0** `<img src>` attributes across `out/`. Baseline: every one
   of the 203 pages, twice on the 46 article pages.
2. The avatar transfers at **under 3 KB** on a page load, measured in DevTools with an empty
   cache. Baseline: 347.1 KB.
3. `next/image` has **0** call sites in `src/`. Baseline: 3.
4. The two SVG logos are byte-identical to `main` and still render in their tiles.
5. Every chrome image carries explicit `width` and `height`, so none of them shifts layout.
6. `npm run test:ci` passes and coverage does not fall by more than the 0.5% threshold in
   `codecov.yml`.
7. A second consecutive `npm run build` skips all image work via the manifest and adds under 2s —
   i.e. the `CONFIG_HASH` regeneration is a one-off, not a permanent cost.
8. `npm run check:bundle` passes, including the new assertion in criterion 1.

## Deferred

- **Serving a 1x-only avatar.** A 40px slot at 1dppx needs 40px, not 96. Emitting a rung that
  small helps only non-retina displays and complicates the ladder; 96w already costs 1.8 KB.
- **`public/images/curtis.png` itself.** 347 KB for a 600×600 PNG is a poorly-optimised source.
  Re-encoding it would shrink the repo, but it is the source of truth and out of scope here.
- **The gravatar favicon**, which is a remote URL and cannot be processed at build time.
- **Netlify build cache for `public/_img/`**, still deferred from the asset-pipeline spec and now
  more relevant: this spec adds two rungs to all 111 images, so a cold Netlify generation gets
  slower. Worth doing next, separately.

## Open Questions

None. Both decisions that materially changed the shape of this work — the widths ladder and the
scope — were put to the human and answered before this document was written; they are recorded in
"Decisions taken" above.
