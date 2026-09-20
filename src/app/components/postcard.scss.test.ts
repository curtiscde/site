import path from 'node:path'
import * as sass from 'sass'

/**
 * jsdom has no layout engine, so the rendered cover widths cannot be asserted here. This
 * compiles the stylesheet and asserts the invariant pair the card layout rests on — see
 * `postcard.scss` for why the two rules only work together.
 *
 * Note the limit: this catches the rule being deleted, not the wider regression class of a
 * new `<picture>` landing in a new flex container. `docs/specs/post-asset-pipeline.md`
 * assumption 7 carries that constraint.
 */
describe('postcard.scss cover layout', () => {
  const css = sass.compile(path.join(__dirname, 'postcard.scss')).css.replace(/\s+/g, ' ')

  it('keeps the <picture> wrapper out of the figure flex layout', () => {
    expect(css).toMatch(/(?:^|\}\s*)a \.post-card figure picture\s*\{[^}]*display:\s*contents/)
  })

  it('still stretches the cover img to the full figure width', () => {
    // Anchored on the non-hover selector: `a:hover .post-card figure img` also contains
    // `.post-card figure img`, so an unanchored match would pass if the min-width moved
    // into the hover rule, where it would no longer size the resting card.
    expect(css).toMatch(/(?:^|\}\s*)a \.post-card figure img\s*\{[^}]*min-width:\s*100%/)
  })
})
