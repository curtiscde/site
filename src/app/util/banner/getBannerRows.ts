import { getPosts, getTopTags } from '../posts'
import { displayTag } from '../tags'
import { buildRows, type BannerRow } from './buildRows'

/**
 * Which composition the banner renders. Mirrors the Hero's own variants:
 * `bare` is the 6rem strip on pages with no title, so it carries one title row and one
 * tag row — scaling the full composition down to that height would be illegible mush.
 */
export type BannerVariant = 'full' | 'compact' | 'bare'

const ROW_COUNTS: Record<BannerVariant, { titles: number; tags: number }> = {
  full: { titles: 4, tags: 4 },
  compact: { titles: 3, tags: 3 },
  bare: { titles: 1, tags: 1 },
}

// Round-1 timings read as far too fast in the browser; these are ~2.5x slower.
// At these periods the full banner's title rows travel ~13px/s and its tag rows ~21px/s.
// They are periods for a row of the *full* banner: see `scaledSeconds`.
const TITLE_SECONDS = 230
const TAG_SECONDS = 135

const MIN_OPACITY = 0.12
const MAX_OPACITY = 0.28

/**
 * Items are dealt across the rows, so fewer rows means proportionally wider tracks. A
 * fixed period over a wider track is a faster scroll — the bare banner's single tag row
 * carries every tag and ran ~4x faster than the homepage's. Stretching the period by the
 * same factor keeps every variant at the homepage's speed.
 */
function scaledSeconds(baseSeconds: number, rowCount: number, fullRowCount: number): number {
  return rowCount > 0 ? Math.round((baseSeconds * fullRowCount) / rowCount) : baseSeconds
}

export function getBannerRows(variant: BannerVariant = 'full'): BannerRow[] {
  const posts = getPosts()
  const { titles: titleRowCount, tags: tagRowCount } = ROW_COUNTS[variant]

  return buildRows({
    titles: posts.map((post) => ({ label: post.title, href: `/post/${post.slug}` })),
    // Every tag, not a shortlist: at four rows the width has to come from somewhere,
    // and repeating a shortlist to fill it is more noticeable than a rare tag shown once.
    tags: getTopTags(posts).map(({ tag }) => ({ label: displayTag(tag), href: `/tag/${tag}`, slug: tag })),
    titleRowCount,
    tagRowCount,
    minOpacity: MIN_OPACITY,
    maxOpacity: MAX_OPACITY,
    titleDurationSeconds: scaledSeconds(TITLE_SECONDS, titleRowCount, ROW_COUNTS.full.titles),
    tagDurationSeconds: scaledSeconds(TAG_SECONDS, tagRowCount, ROW_COUNTS.full.tags),
  })
}
