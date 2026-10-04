# Spec: Blur the marquee behind the hero panel

Status: **implemented** · Branch: `fix/hero-panel-blur`

## Objective

The hero's title panel (`.hero-panel` in `src/app/components/Hero.scss`) sits over the scrolling
marquee rows. It was meant to frost them with `backdrop-filter: blur(14px) saturate(1.3)` over
`rgba(8, 10, 14, 0.42)`, but in Chrome the rows behind it were perfectly sharp: "productivity",
"react" and "agentic-engineering" could all be read through the panel, and the last one ran
straight through the hairline under the title. Crisp, moving text right behind the heading pulls
the eye away from it.

Success is: the rows still show through the panel as soft, recognisable words, so the panel
reads as glass over a live banner, but they are blurred enough not to compete with the title.

### User stories

- As a reader landing on any listing page, my eye goes to the title, not to the tags drifting
  behind it.
- As the site owner, the banner keeps its glass look: the marquee is visibly there behind the
  panel, just softened.

### Explicitly out of scope

- **Plasma UI (`@cruxgarden/plasma-ui`) or any WebGL/canvas glass.** It renders to a `<canvas>`
  and can only refract a background handed to it as an image, canvas or video. It cannot sample
  DOM text, so it cannot blur the marquee without re-rendering the marquee into a canvas,
  which would lose the real anchors, the spotlight and keyboard access. It is also GPU-heavy and,
  in its own words, does not run well on mobile, and it is at 0.3.0 with an unstable API.
- **Panel size, padding or layout**, and the clickability of rows behind it (already blocked by
  the panel's `pointer-events: auto`).
- **The `bare` variant**, which has no panel.
- **Marquee speed, row content, spotlight behaviour and pointer parallax.**

## Root cause

The blur was never applied in Chrome. `Hero.scss` declared:

```scss
backdrop-filter: blur(14px) saturate(1.3);
-webkit-backdrop-filter: blur(14px) saturate(1.3);
```

Next's CSS pipeline (Lightning CSS) treats `-webkit-backdrop-filter` as the same property, so
the later prefixed line replaced the unprefixed one. The compiled rule shipped only
`-webkit-backdrop-filter:blur(14px)saturate(1.3)`. Chrome only reads the unprefixed form, so
DevTools reported `backdrop-filter: none` on the panel. What looked like a weak blur was really
sharp text seen through a 42% tint.

`TagGraph.scss` declares only the unprefixed property, and its compiled output carries both
forms. That confirms the pipeline adds the prefix itself for the browser targets that need it.

## Decisions taken (confirmed with the human)

1. Do not adopt Plasma UI; solve it in CSS.
2. **Diagnose before tuning.** Diagnosis found the root cause above.
3. **Fix the cause:** delete the hand-written `-webkit-backdrop-filter` line and let the pipeline
   add the prefix.
4. **Blur 2px, tint unchanged at 0.42.** With the blur working, 14px erased the rows entirely,
   which the human did not want: the text should still be visible, just a bit blurred. The value
   was tuned by eye on the live page with a temporary slider.
5. **No mask, no measuring component, no stronger frost.** These were planned when we thought the
   blur was working but too weak. A mask hides the rows completely, which contradicts decision 4.
6. **Scope:** every banner with a panel (full, `compact`, tag and custom-title pages), in light
   and dark themes. One rule covers all of them.

## Change

`src/app/components/Hero.scss`, `.hero-panel`:

- remove `-webkit-backdrop-filter`;
- `backdrop-filter: blur(14px) saturate(1.3)` → `blur(2px) saturate(1.3)`;
- comment explaining both, in the file's existing *why, not what* style.

The `@supports not (backdrop-filter: …)` fallback (0.88 alpha) is unchanged. Browsers without
backdrop-filter get a near-solid panel, as before.

## Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run test:ci
npm run build
npm run check:bundle
```

## Testing Strategy

- CSS is not unit-tested in this repo, and no component behaviour changes, so no new tests.
- **Build check:** the compiled CSS in `out/_next/static/` must contain an unprefixed
  `backdrop-filter:blur(2px)saturate(1.3)` on `.hero-panel`.
- **Visual check in Chrome:** the home page, a tag page and dark mode. The rows behind the panel
  should be visible but soft, and the title and subtitle should read clearly.

## Boundaries

**Always**

- Run the commands above before opening the PR.
- Never hand-write `-webkit-backdrop-filter` (or other prefixes Lightning CSS manages) next to
  the standard property.

**Ask first**

- Changing the blur or tint values chosen in decision 4.
- Adding any dependency.

**Never**

- Add Plasma UI or any canvas/WebGL renderer.

## Success Criteria

1. Chrome computes `backdrop-filter: blur(2px) saturate(1.3)` on `.hero-panel`. Baseline: `none`.
2. The production CSS contains the unprefixed declaration. Baseline: only the `-webkit-` form.
3. Rows behind the panel are visibly blurred but still recognisable as text, on the home page,
   a tag page and in dark mode.
4. All commands above pass.

## Deferred

- **A soft mask thinning the rows towards the panel**, sized from the panel by a
  `ResizeObserver`. Only worth doing if 2px ever proves too busy. The approach is to subtract a
  feathered hole, built from the union of two inverted bands, from the `.hero-rows` edge fade.
- **Safari/Firefox-specific tuning.** Safari now receives the `-webkit-` form from the pipeline,
  and Firefox reads the unprefixed one.

## Open Questions

None.
