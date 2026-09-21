import { getPosts, getTopTags } from '../posts'
import { displayTag } from '../tags'
import { buildRows, type BannerRow } from './buildRows'

/**
 * Which composition the banner renders. Mirrors the Hero's own variants:
 * `bare` is the 6rem strip on pages with no title, so it carries one tag row —
 * scaling the full composition down to that height would be illegible mush.
 */
export type BannerVariant = 'full' | 'compact' | 'bare'

const ROW_COUNTS: Record<BannerVariant, { titles: number; tags: number }> = {
  full: { titles: 4, tags: 4 },
  compact: { titles: 3, tags: 3 },
  bare: { titles: 0, tags: 1 },
}

// Round-1 timings read as far too fast in the browser; these are ~2.5x slower.
// At these periods the title rows travel ~13px/s and the tag rows ~21px/s.
const TITLE_SECONDS = 230
const TAG_SECONDS = 135

const MIN_OPACITY = 0.12
const MAX_OPACITY = 0.28

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
    titleDurationSeconds: TITLE_SECONDS,
    tagDurationSeconds: TAG_SECONDS,
  })
}
