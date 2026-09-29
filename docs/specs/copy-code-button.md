# Spec: Copy button on post code blocks

Status: **implemented** · Branch: `worktree-copy-code-block`

> **Corrections (during implementation).**
>
> - **`PostPage` now memoises `{ __html }`.** React 19 compares `dangerouslySetInnerHTML` by
>   object *identity*, not by its string (verified in react-dom 19.2.8), so every re-render of
>   `PostPage` re-set the article's innerHTML — re-hiding the copy buttons and undoing the
>   lightbox's image attributes. Nothing re-renders `PostPage` today, so it was latent; it surfaced
>   when a test re-rendered it. Added at the human's request, with a regression test.
> - **`ts` is aliased to `typescript`.** Posts used both spellings, which would have split the
>   `copy_code` report. Follows the existing abbreviation-to-full-name aliases (`md`, `zsh`).
> - **The horizontal scroll container is `<code>`, not `<pre>`.** atom-one-dark gives
>   `code.hljs` `display: block; overflow-x: auto`. The design holds either way — the button sits
>   outside both — but Chrome makes the scrollable `<code>` focusable, so on overflowing blocks
>   Tab stops on the code (which lets keyboard users scroll it) before the button.
> - **Tests live in `CodeCopy.test.tsx`**, driving the component with real renderer output,
>   rather than a bare hook test — the `ArticleLightbox` pattern.
> - **Copied text has no trailing newline**, because marked strips it from the fence. That is
>   the source as written.

## Objective

Code blocks in posts can only be copied by selecting the text by hand. On a long or
horizontally scrolling block that is fiddly, and on a phone it is worse. Many technical blogs put
a copy control in the top-right corner of each block; this adds one here.

The site owner also wants to know whether anyone actually uses it, so each successful copy is
recorded as a GA4 event, for readers who have accepted analytics cookies.

Scale: **153 fenced or indented code blocks across 41 posts** (72 `js`, 36 `html`, 10 `css`,
9 `bash`, 5 with no language, the rest spread across 11 other names). Every one gets a button.

### User stories

- As a reader, I can copy a whole snippet with one click or tap, without selecting it.
- As a keyboard or screen-reader user, I can reach the button with Tab, I know what it does, and
  I am told when the copy has worked.
- As the site owner, I can see in GA4 how often code gets copied, from which posts, and which
  snippets.

### Explicitly out of scope

- **Language label / header bar above the block.** Deferred as its own change. A header bar
  is the natural home for both a label and the button, so the button's placement is
  revisited then.
- **Copy buttons on inline `code`.**
- **Line numbers, line highlighting, "copy without prompts" for shell blocks.**

## Decisions taken (confirmed with the human before implementation)

| Question | Decision |
|---|---|
| Build it at all? | Yes. |
| Which blocks? | Every block the `code` renderer emits. No length threshold — a one-line `npm install` is the most-copied kind. |
| Visibility | Always visible, understated: reduced opacity at rest, full on hover / `:focus-visible`. Hover-only was rejected because touch has no hover and keyboard users can't find it. |
| Button content | Icon only: Lucide `Copy`, swapping to Lucide `Check` for ~2 s after a copy. `aria-label="Copy code"`; a visually hidden live region announces "Copied". |
| Where the markup comes from | Emitted at build time by the `code` renderer in `types/Post.ts`. A client hook handles clicks by delegation on the article container, the same pattern as `ArticleLightbox`. |
| Position | Button sits on a `position: relative` wrapper around `<pre>`, **not** inside `<pre>`, so it stays in the corner while the code scrolls sideways underneath it. Semi-opaque dark background so code under it stays legible. |
| Theme | One style for both site themes — code blocks are always atom-one-dark. |
| What gets copied | `textContent` of the `<code>` element at click time. For highlight.js output this equals the source; no duplicate copy of each snippet in a `data-` attribute. |
| Clipboard API missing | Button hidden. A rejected `writeText` shows a brief failure state ("Couldn't copy" to screen readers). |
| Analytics | GA4 event `copy_code` with `language` and `block_index`. |
| Language label | Deferred (above). |

## Assumptions

1. **Consent can't be withdrawn once given.** `ConsentContext` only moves from `undecided` to
   `granted` or `denied`, and `CookieBanner` is the only UI that changes it. The hook still
   checks `consent === 'granted'` itself rather than relying on `window.gtag` existing, so it stays
   correct if a withdraw control is added later (GA's script stays on `window` after unmounting).
2. **The RSS feed is unaffected.** `rss.xml/route.ts` emits `post.description` only, never
   `contentHtml`, so the button markup cannot leak into feeds. If that changes, the feed needs
   to strip `.code-block__copy`.
3. **Production is HTTPS**, so `navigator.clipboard` is available in every supported browser.
   The "hidden when unsupported" path is a safety net for `http://` LAN previews and very old
   browsers.
4. **Event counts are a lower bound.** Only readers who accepted cookies are counted.

## Design notes

**The button must not live inside `<pre>`.** `<pre>` is the horizontal scroll container. An
absolutely positioned child of it scrolls with the content and slides out of view on any long
line. The wrapper is the positioned ancestor; `<pre>` scrolls inside it.

**The markup is inert without JavaScript, so it ships hidden.** The button is rendered with the
`hidden` attribute. The hook removes `hidden` only once it has confirmed `navigator.clipboard`
exists. No JS, or no clipboard API, means no dead control on the page. (This is the lightbox's
rule too: "without this script running there is no control here, so the article must not
advertise one.")

**Never write `hljs` in client code.** `scripts/check-client-bundle.mjs` fails the build if
`/\bhljs\b/` appears in any post-page chunk, because that is how it detects highlight.js leaking
into the browser. The hook therefore selects by the new `code-block` classes, never by
`code.hljs`.

**Language comes from the build, not from the class list.** The renderer already resolves the
fence name through `LANGUAGE_ALIASES` and `hljs.getLanguage`. It writes the result to
`data-language` on the wrapper (`none` for unknown or missing languages, which
highlight.js auto-detects), so the hook reads one attribute and never parses class names.
Aliased fences report their normalised name: `zsh` is recorded as `bash`, `markup` as `xml`.

**`block_index` is the block's zero-based position among the post's code blocks**, from DOM order
at click time. Together with the page path GA already records, it identifies the snippet.

**Icons are inlined SVG strings, not `lucide-react`.** The renderer produces a string on the
server, so React components are not available there. The two Lucide path sets are copied in as
constants (ISC licence, attribution comment beside them), and CSS swaps between them via
`data-state` on the button.

### Target markup

```html
<div class="code-block" data-language="js">
  <pre><code class="hljs language-js">…highlighted…</code></pre>
  <button type="button" class="code-block__copy" aria-label="Copy code" hidden>
    <svg class="code-block__icon code-block__icon--copy" aria-hidden="true">…</svg>
    <svg class="code-block__icon code-block__icon--done" aria-hidden="true">…</svg>
  </button>
</div>
```

Button `data-state` goes through `idle` → `copied` | `failed` → back to `idle` after 2000 ms.
A single visually hidden `aria-live="polite"` region, rendered once by the client component
(not once per block), announces "Copied" / "Couldn't copy".

### Event

```ts
window.gtag('event', 'copy_code', { language: 'js', block_index: 2 })
```

Sent only when the write succeeds, `consent === 'granted'`, and `typeof window.gtag === 'function'`.
Failures are not tracked.

## Project Structure

```
src/app/types/Post.ts                              → code renderer emits wrapper, data-language, hidden button; ts → typescript alias
src/app/types/Post.test.ts                         → renderer output assertions
src/app/components/CodeCopy/codeBlockIcons.ts      → NEW: Lucide Copy/Check SVG strings (server-only import)
src/app/components/CodeCopy/useCodeCopy.ts         → NEW: delegated click handler, clipboard, state, gtag
src/app/components/CodeCopy/CodeCopy.test.tsx      → NEW: component + hook + tracking, on real renderer output
src/app/components/CodeCopy/CodeCopy.tsx           → NEW: 'use client'; runs the hook, renders the live region
src/app/components/CodeCopy/CodeCopy.scss          → NEW: wrapper, button, icon swap, focus ring
src/app/components/PostPage.tsx                    → mounts <CodeCopy containerRef={article} />; memoises { __html }
src/app/components/PostPage.test.tsx               → buttons revealed; one live region; survives a re-render
CLAUDE.md                                          → separate commit: "showdown" → "marked", highlighting at build time
```

`codeBlockIcons.ts` is imported by `types/Post.ts` only, so it stays server-side.

## Code Style

Match `ArticleLightbox`: a hook holding the logic, exported pure helpers that the tests hit
directly, and a thin component. Comments explain *why*, as in `types/Post.ts`.

```ts
/**
 * Code blocks arrive through `dangerouslySetInnerHTML`, so there is no component per
 * block. One listener on the article handles every button.
 */
export function useCodeCopy(containerRef: React.RefObject<HTMLElement | null>) {
  const { consent } = useConsent()
  // …
}
```

## Testing Strategy

| Level | What it covers |
|---|---|
| Unit (`Post.test.ts`) | A known-language fence renders `.code-block[data-language="js"]` wrapping `<pre><code class="hljs language-js">`, followed by a `hidden` `button.code-block__copy` with `aria-label`. An aliased fence (`zsh`) reports `bash`. An unlabelled fence reports `none`. The highlighted code itself is unchanged from today. |
| Component + hook (`CodeCopy.test.tsx`, jsdom, fed real renderer output) | Buttons are un-hidden when `navigator.clipboard` exists and stay hidden when it doesn't. Clicking writes the `<code>` element's `textContent`. State goes `copied` then back to `idle` after 2000 ms (fake timers). A rejected `writeText` sets `failed`. The live region text updates. `gtag` is called with `copy_code`, `language` and `block_index` when consent is `granted`; **not** called when consent is `denied` / `undecided`, when `gtag` is undefined, or when the copy fails. Clicks outside a copy button are ignored. |
| Component (`PostPage.test.tsx`) | Mounts with a post containing code; exactly one live region. |
| Build (`check:bundle`) | Post-page JS stays within the 190 KB gzipped budget and contains no `hljs`. |
| Manual | A post with long lines (horizontal scroll: button stays put), a one-line bash block, an unlabelled block — each in light and dark themes, on desktop and at phone width. Keyboard: Tab reaches the button, Enter copies, focus ring visible. GA4 DebugView shows `copy_code` after accepting cookies, and nothing after declining. |

Tests are written first and seen to fail against the current renderer and without the hook.

## Boundaries

**Always**
- Run `npm run lint`, `npx tsc --noEmit`, `npm run test:ci`, `npm run build` and
  `npm run check:bundle` before asking for review.
- Keep the highlighted `<pre><code class="hljs …">` output byte-identical inside the new wrapper.
- Honour `prefers-reduced-motion` on any transition added.

**Ask first**
- Raising `BUDGET_KB` in `check-client-bundle.mjs`, if the hook pushes post-page JS over it.
- Adding a dependency.
- Committing, pushing, or opening a PR. **Nothing is committed until the human says so.**

**Never**
- Import `types/Post` (or `codeBlockIcons.ts`) from client code, or write `hljs` in a client
  file.
- Send an analytics event without `consent === 'granted'`.
- Put the button inside `<pre>`.
- Show the button before the hook has confirmed the clipboard API.

## Success Criteria

1. Every code block on every post renders inside `.code-block` with a copy button in its top-right
   corner; inline `code` does not.
2. The button stays in the corner while a long line is scrolled horizontally.
3. Clicking or pressing Enter on it puts the block's exact source on the clipboard, shows the tick
   for ~2 s, and screen readers hear "Copied".
4. With JavaScript disabled, no button is visible.
5. With `navigator.clipboard` undefined, no button is visible.
6. After accepting cookies, a copy fires one `copy_code` event with `language` and `block_index`;
   after declining, none fires.
7. `npm run test:ci`, `npm run lint`, `npx tsc --noEmit`, `npm run build` and
   `npm run check:bundle` all pass.
8. CLAUDE.md names `marked`, not `showdown`, in a separate commit.

## Verification (at implementation)

- `npm run test:ci`, `npx tsc --noEmit`, `npm run lint` and `npm run build` all pass.
- `npm run check:bundle`: post-page JS **184.2 KB** gzipped, within the 190 KB budget; no marked
  or highlight.js in client chunks.
- Static output: 153 `.code-block` wrappers, each with a `hidden` button, across 41 posts; none
  in `rss.xml`.
- In Chrome against the static build: criteria 1–3 confirmed by mouse and keyboard, at 350px and
  in both themes; criterion 2 on a 307-character line.
- **Criterion 6 is covered by unit tests only.** Confirming it in a browser means accepting the
  cookie banner, which sends real events to the live GA4 property. Check it in GA4 DebugView.

## Open Questions

None.
