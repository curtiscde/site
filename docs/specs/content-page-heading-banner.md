# Spec: Content-page heading accent + compact banner

Status: **implemented** · Branch: `feat/content-page-heading-banner`

## Objective

The standalone content pages — `/uses` and `/privacy-policy` — currently render as a bare
`<main className="prose">` with no banner and an unstyled `<h1>`. They look disconnected from
the rest of the site, where every other page is topped by the `Hero` banner and blog articles
carry a distinctive purple accent line under the `<h1>`.

Bring these two pages in line by giving them:

1. The same purple 1em accent line under the page `<h1>` that blog articles have.
2. A **bare** (thin, image-only) version of the `Hero` banner above the content — no title or
   subtitle text.

A follow-up request extended the work to `/cv`, which needed a *shorter* banner that still keeps
its title and subtitle. That is a different shape from the image-only one, so `Hero` gained a
`variant` prop with two named sizes rather than a pile of booleans:

| Variant | Text | Height | Used by |
|---|---|---|---|
| *(none)* | title + subtitle | `py-20`, ~290px | `/`, `/posts/[page]`, `/tags`, `/tag/*` |
| `compact` | title + subtitle | `py-10`, ~210px | `/cv` |
| `bare` | none | `min-height: 6rem` | `/uses`, `/privacy-policy` |

### User stories

- As a reader landing on `/uses` from an external link, I see the same visual identity
  (cover banner + purple heading accent) as when I land on a blog post, so the page reads as
  part of the site rather than an orphan.
- As the site owner, I get reusable named banner sizes and one reusable heading-accent
  rule that future content pages can adopt without copy-pasting CSS.

### Explicitly out of scope

- **Homepage (`/`)** — unchanged. Keeps the full-height `Hero` with title + subtitle.
- **Blog article pages (`/post/[slug]`)** — unchanged. No banner added, heading accent untouched.
- **`/tags`, `/tag/*`, `/posts/[page]`** — unchanged. They keep the current full-height `Hero`
  with their existing text.
- **`/cv`** — banner height reduced (`compact`); its text, layout and `.cv-heading` accent are
  otherwise untouched.
- Consolidating the three now-existing copies of the accent rule (`.post-page h1::before`,
  `.cv-heading::after`, and the new `.content-page h1::before`) into one shared mixin. Noted as
  a follow-up in [Deferred](#deferred) — doing it here would mean editing blog-article and CV
  styling, which this change is meant to leave alone.

## Decisions taken (confirmed with the human before writing this spec)

| Question | Decision |
|---|---|
| What does the banner show on `/uses` and `/privacy-policy`? | **Image only, no text.** The page's own `<h1>` stays in the prose below and receives the purple accent. |
| Which pages get a reduced-height banner? | Initially **only `/uses` and `/privacy-policy`**; `/cv` was added by a follow-up request. Everything else keeps its current height. |
| How much thinner? | `/uses` + `/privacy-policy` went `10rem` → **`6rem`** on a second pass ("even thinner"). `/cv` halves its padding, `py-20` → `py-10`. |

## Assumptions

1. "Purple line" = the `4px solid var(--color-primary)` accent, `1em` wide, positioned under the
   `<h1>` baseline — the rule at `src/app/post/[slug]/PostPage.scss:6-14`. `--color-primary`
   resolves to the DaisyUI theme primary (`src/app/globals.scss:6`), which is the purple in the
   supplied screenshot. Reusing the CSS variable means the accent tracks the light/dark theme
   automatically, as it already does on article pages.
2. "Header banner" = the `Hero` component (`src/app/components/Hero.tsx`), i.e. the `cover.jpg`
   band with the 4px primary bottom border — **not** the `Header` navbar, which already appears
   on both pages and is unchanged.
3. "Reduced size" means **height**; the image stays full-bleed width. The existing `Hero` is
   `py-20` (160px padding) plus ~130px of text ≈ 290px tall. `bare` is a fixed `6rem` / 96px
   band; `compact` halves the padding to `py-10`, landing at ≈210px.
4. On `/uses`, the accent applies to the markdown-rendered `# Uses` `<h1>` only — the `##`
   section headings (Hardware, Audio, Development…) stay unstyled, mirroring blog articles where
   only the `<h1>` carries the accent.
5. A text-free banner is decorative; it introduces no heading into the document outline, so the
   existing single-`<h1>`-per-page structure is preserved on both pages.

→ Correct any of these now; the implementation follows them directly.

## Tech Stack

- Next.js 16 (App Router, `output: 'export'`) · React 19 · TypeScript 6
- Tailwind CSS 3.4 + DaisyUI 4.12 + `@tailwindcss/typography`
- SCSS modules per component (`sass` 1.99)
- Jest 30 + React Testing Library 16 (`jsdom`)

## Commands

```bash
npm run dev        # Dev server — manual visual check at /uses, /privacy-policy, /, /post/<any>
npm run build      # Static export; must pass before merge
npm run lint       # ESLint over src
npm run test:ci    # Jest with coverage (what CI runs)

npx jest src/app/components/Hero.test.tsx        # Single file during development
npx jest src/app/uses src/app/privacy-policy
```

## Project Structure

Files this change touches or creates:

```
src/app/components/Hero.tsx            → add `variant` prop (modified)
src/app/components/Hero.scss           → bare height rule (modified)
src/app/components/Hero.test.tsx       → variant tests (modified)
src/app/components/ContentPage.scss    → NEW: `.content-page h1` accent rule
src/app/uses/page.tsx                  → add <Hero variant="bare" />, wrap main (modified)
src/app/uses/page.test.tsx             → NEW: no test exists for this page today
src/app/privacy-policy/page.tsx        → add <Hero variant="bare" />, wrap main (modified)
src/app/privacy-policy/page.test.tsx   → assert banner present (modified)
src/app/cv/page.tsx                    → <Hero variant="compact" /> (modified)
src/app/cv/page.test.tsx               → NEW: no test exists for this page today
docs/specs/                            → NEW: this spec
```

Untouched, and verified untouched by the success criteria:
`src/app/page.tsx`, `src/app/posts/[page]/page.tsx`, `src/app/tags/page.tsx`,
`src/app/tag/**`, `src/app/post/[slug]/*`, `src/app/components/PostPage.*`,
`src/app/cv/Cv.scss`, `src/app/cv/experience.ts`, `src/app/cv/components/*`.

## Code Style

Match the existing components: named exports, no default exports for components, props typed via
an `interface` above the component, SCSS co-located and imported at the top of the `.tsx`.

The sizes follow the existing prop-driven `Hero` pattern rather than new components, so the four
untouched call sites keep working with zero changes. A single `variant` union beats two booleans
(`compact` + `bare` would both have meant "smaller", with an undefined meaning when combined):

```tsx
/**
 * `compact` keeps the title/subtitle but halves the vertical padding.
 * `bare` drops the text entirely for a thin image-only band.
 */
type HeroVariant = 'compact' | 'bare'

interface HeroProps {
  tag?: string
  title?: string
  subtitle?: string
  variant?: HeroVariant
}

export const Hero = ({ tag, title, subtitle, variant }: HeroProps) => {
  const isBare = variant === 'bare'

  return (
    <div
      className={variant != null ? `hero hero--${variant}` : 'hero'}
      style={{
        background: 'no-repeat fixed 50% 100% / cover',
        backgroundImage: 'url(/images/cover.jpg)',
      }}
    >
      <div className="hero-overlay bg-opacity-10"></div>
      {!isBare && (
        <div className={`hero-content text-neutral-content text-center ${variant === 'compact' ? 'py-10' : 'py-20'} text-white`}>
          <div className="max-w-md hero-text-container">
            <Content tag={tag} title={title} subtitle={subtitle} />
          </div>
        </div>
      )}
    </div>
  )
}
```

Note both `py-10` and `py-20` appear as bare string literals so Tailwind's scanner emits them —
a computed `` `py-${n}` `` would be silently dropped from the stylesheet. Verified present in the
build output.

The accent rule mirrors `.post-page h1::before` verbatim so the two are pixel-identical:

```scss
// Mirrors .post-page h1::before — a 1em-wide 4px primary underline beneath the page heading.
.content-page {
  h1 {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      bottom: -.334em;
      width: 1em;
      margin-bottom: -2px;
      border-bottom: 4px solid var(--color-primary);
    }
  }
}
```

Page composition, identical on both pages:

```tsx
<>
  <Header />
  <Hero variant="bare" />
  <main className="content-page container mx-auto px-4 py-8 prose max-w-3xl">…</main>
</>
```

## Testing Strategy

Jest + RTL, tests co-located beside the file under test (repo convention: `Hero.test.tsx` sits
next to `Hero.tsx`). SCSS imports are handled by `next/jest`, so component tests assert on class
names and DOM structure, not computed styles — jsdom does not apply the stylesheet.

| Level | What it covers |
|---|---|
| Component (`Hero.test.tsx`) | `bare` renders no heading/subtitle and carries `hero--bare`; `compact` keeps title + subtitle and swaps `py-20` for `py-10`; default/tag/title variants carry neither modifier and stay `py-20` (regression guard for the four untouched call sites). |
| Page (`uses/page.test.tsx`, `privacy-policy/page.test.tsx`) | Exactly one `<h1>` with the right name; `main` carries `content-page`; the bare banner is rendered. Existing privacy-policy assertions (section headings, links, header) must all still pass. |
| Page (`cv/page.test.tsx`) | Banner keeps its title and subtitle, carries `hero--compact` and `py-10`, and is **not** `bare`; experience section and LinkedIn link still render. |
| Build (`npm run build`) | Static export succeeds — catches SCSS syntax errors, Next.js server/client boundary mistakes, and Tailwind classes that failed to get scanned. |
| Manual | Dev-server check of `/uses`, `/privacy-policy`, `/cv` (changed) and `/`, `/post/<any>` (must be visually identical to `main`), in **both** light and dark themes. |

Pages mock `../components/Header` (as `privacy-policy/page.test.tsx` already does) but render the
real `Hero`, since the banner's presence is the thing under test. `uses/page.test.tsx` calls the
real `getMarkdownContent`, which reads `content/uses.md` from `process.cwd()` — this works under
Jest without mocking because the page component is synchronous and Node `fs` is available in the
jsdom environment.

Coverage: no threshold is configured in `jest.config.ts`; the goal is that all three `variant`
states are exercised, not a percentage.

## Boundaries

**Always**
- Run `npm run lint`, `npm run test:ci`, and `npm run build` before committing.
- Keep the accent colour as `var(--color-primary)` — never a hard-coded hex — so it follows the theme.
- Verify both light and dark themes for any visual change.
- Add or extend a test for every behavioural change, in the same commit.

**Ask first**
- Changing `Hero`'s default (no-variant) height, spacing, or markup in a way that alters the
  homepage, `/tags`, `/tag/*`, or `/posts/[page]`.
- Adding a dependency, or introducing a CSS approach not already used here (CSS-in-JS, a new
  Tailwind plugin).
- Changing the copy or structure of `content/uses.md` or the privacy-policy text.
- Restyling `/post/[slug]` or `/cv` headings, even to de-duplicate CSS.

**Never**
- Delete or weaken an existing passing test to make a new change go green.
- Alter `src/app/page.tsx` or `src/app/components/PostPage.tsx` — the human named both as fixed.
- Commit or push without being asked.

## Success Criteria

Each is independently checkable.

1. `/uses` renders a banner above its content: an element with classes `hero hero--bare`,
   containing no heading and no subtitle text.
2. `/privacy-policy` renders the same bare banner.
3. The bare banner's rendered height is 6rem/96px — a thin band, roughly a third of the full
   `Hero` — and it keeps the existing 4px `--color-primary` bottom border.
4. `/uses` shows exactly one `<h1>` ("Uses"), and `/privacy-policy` exactly one ("Privacy Policy"),
   each with the purple 1em accent line beneath it, visually matching a blog article's `<h1>`.
5. On `/uses`, `<h2>` section headings have **no** accent line.
6. The accent is visible and correctly coloured in both light and dark themes on both pages.
7. `/` renders an unchanged full-height `Hero` with the site title and subtitle.
8. `/post/<any slug>` is unchanged: no banner, `<h1>` accent exactly as before.
9. `/tags`, `/tag/<tag>`, and `/posts/2` all render the unchanged full-height `Hero` at `py-20`
   with no `hero--*` modifier.
10. `/cv` renders its banner at `py-10` with `hero--compact`, still showing "Curriculum Vitae"
    and the subtitle; its `Experience` heading accent and company rows are unchanged.
11. `git diff --stat main` touches only the files listed under [Project Structure](#project-structure).
12. `npm run lint` reports no new errors or warnings.
13. `npm run test:ci` passes, including every pre-existing assertion in
    `privacy-policy/page.test.tsx` and `Hero.test.tsx`.
14. `npm run build` completes and the static export contains `out/uses.html` and
    `out/privacy-policy.html`, both carrying `hero--bare` and `content-page`; the compiled CSS
    contains `.hero.hero--bare{min-height:6rem}` and `.py-10`.

## Deferred

- **Accent-rule duplication.** After this change the same declaration block exists three times:
  `.post-page h1::before`, `.cv-experience .cv-heading::after`, and `.content-page h1::before`.
  A shared SCSS mixin or a single `.heading-accent` utility would collapse them, but doing so
  edits blog-article and CV styling, which this change deliberately does not touch. Worth a
  follow-up PR whose only job is that refactor, verified by before/after screenshots.
- Adopting `<Hero variant="bare" />` on `/post/[slug]`, should the banner-on-article-pages question ever
  come up — explicitly rejected for now.

## Open Questions

None blocking. Both forks (banner content, reduction scope) were resolved before this spec was
written; see [Decisions taken](#decisions-taken-confirmed-with-the-human-before-writing-this-spec).

One item to confirm at review, not blocking implementation:

- **The two heights are still unverified by eye.** `bare` at `6rem` and `compact` at `py-10` were
  both arrived at arithmetically, and `bare` has already been narrowed once (`10rem` → `6rem`) on
  request. At `6rem` the cover image is cropped hard, so its focal point may no longer read well.
  Both are one-line changes (`Hero.scss`, and the `py-10` literal in `Hero.tsx`). Settle them
  during the manual visual check.
