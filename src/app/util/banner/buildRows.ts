/**
 * Row layout for the banner marquee.
 *
 * Pure and DOM-free: this runs during `next build`, and the rows it returns are
 * server-rendered into the HTML. Nothing here may reach a browser bundle, which is
 * also why it takes plain `{ label, href }` rather than `Post` — importing `Post`
 * pulls marked and highlight.js across the client boundary. See
 * scripts/check-client-bundle.mjs.
 */

export interface BannerItem {
  /** What the reader sees — a post title, or a tag's display name. */
  label: string
  href: string
  /**
   * Tag rows only; titles leave it unset. The active-tag highlight compares against
   * the slug from the route params, and `label` can no longer serve: a tag with a
   * display name has a label (`c#`) that never equals its slug (`c-sharp`).
   */
  slug?: string
}

export interface BannerRow {
  kind: 'title' | 'tag'
  items: BannerItem[]
  /** 'left' scrolls content leftwards; 'right' runs the same keyframes reversed. */
  direction: 'left' | 'right'
  opacity: number
  durationSeconds: number
}

export interface BuildRowsOptions {
  titles: BannerItem[]
  tags: BannerItem[]
  titleRowCount: number
  tagRowCount: number
  minOpacity: number
  maxOpacity: number
  titleDurationSeconds: number
  tagDurationSeconds: number
}

/**
 * Deal round-robin rather than in contiguous slices, so each row gets a spread across
 * the whole corpus instead of one chronological clump.
 */
function deal(items: BannerItem[], rowCount: number): BannerItem[][] {
  if (rowCount <= 0) return []
  const rows: BannerItem[][] = Array.from({ length: rowCount }, () => [])
  items.forEach((item, index) => {
    rows[index % rowCount].push(item)
  })
  return rows
}

/**
 * Triangular ramp: faintest at the top and bottom edges, strongest through the middle,
 * so the readable content sits where the eye already is and the outer rows read as
 * texture. With an even row count the peak falls between the two centre rows and
 * neither quite reaches `maxOpacity` — intentional, it keeps the ramp symmetrical.
 *
 * One or two rows have no middle to frame: the ramp would put a pair at `minOpacity`,
 * leaving the bare strip as nothing but faint edges. They get `maxOpacity` instead.
 */
function rampOpacity(index: number, total: number, min: number, max: number): number {
  if (total <= 2) return max
  const centre = (total - 1) / 2
  const distance = Math.abs(index - centre) / centre
  return Number((min + (max - min) * (1 - distance)).toFixed(3))
}

export function buildRows({
  titles,
  tags,
  titleRowCount,
  tagRowCount,
  minOpacity,
  maxOpacity,
  titleDurationSeconds,
  tagDurationSeconds,
}: BuildRowsOptions): BannerRow[] {
  const titleGroups = deal(titles, titleRowCount)
  const tagGroups = deal(tags, tagRowCount)

  // Interleave the two kinds rather than stacking all the titles then all the tags:
  // alternating long titles against short tags is what gives the field its rhythm.
  const ordered: Array<{ kind: 'title' | 'tag'; items: BannerItem[] }> = []
  const longest = Math.max(titleGroups.length, tagGroups.length)
  for (let i = 0; i < longest; i += 1) {
    if (i < titleGroups.length) ordered.push({ kind: 'title', items: titleGroups[i] })
    if (i < tagGroups.length) ordered.push({ kind: 'tag', items: tagGroups[i] })
  }

  const total = ordered.length

  return ordered.map(({ kind, items }, index) => ({
    kind,
    items,
    direction: index % 2 === 0 ? 'left' : 'right',
    opacity: rampOpacity(index, total, minOpacity, maxOpacity),
    // Offset each row's period so the tracks never resynchronise into one visible
    // pulse. Deliberately not multiples of each other.
    durationSeconds: (kind === 'title' ? titleDurationSeconds : tagDurationSeconds) + (index % 5) * 7,
  }))
}
