/**
 * Display names for tags whose slug is not how the thing is actually written.
 *
 * Tag slugs are the source of truth: they are what sits in post frontmatter, what
 * `/tag/{tag}` resolves, and what every `href` is built from. None of that changes.
 * This is a presentation layer on top — the string a reader sees.
 *
 * The bar for an entry is deliberately narrow: **if nobody writes the tag that way,
 * map it; otherwise leave it.** That is not the same as "restore characters the URL
 * could not carry", which is the rule this started as and which is wrong. `nodejs`,
 * `nextjs`, `chartjs` and `lastfm` all lost a dot to the slug, and all four are left
 * alone, because those are how the projects write their own names — chartjs.org is
 * literally the domain. `c-sharp`, by contrast, is written by no one, ever.
 *
 * Lowercase is the house style rather than an enforced rule. Nothing here validates
 * case, so a tag whose real form is capitalised can be spelled that way.
 */
const TAG_DISPLAY: Record<string, string> = {
  // `#` cannot appear in a URL path — it opens the fragment — so the slug has always
  // been a workaround rather than a name.
  'c-sharp': 'c#',
  // A literal identifier you would paste into an editor; `console-log` is not a thing
  // anyone types.
  'console-log': 'console.log',
}

/**
 * The string to show for a tag. Unmapped tags are returned unchanged, which is the
 * common case by a wide margin — 144 of the 146 tags in the corpus are already
 * written the way people write them.
 */
export function displayTag(tag: string): string {
  return TAG_DISPLAY[tag] ?? tag
}

/**
 * The mapped slugs, for the test that asserts none of them has gone stale. Exported
 * for that purpose rather than as part of the rendering API — callers want
 * `displayTag`.
 */
export function mappedTagSlugs(): string[] {
  return Object.keys(TAG_DISPLAY)
}
