import { Post } from '../../types';

export interface RelatedTag {
  tag: string
  /** Posts carrying both this tag and the one being related to. */
  sharedCount: number
  /** Posts carrying this tag at all. */
  postCount: number
}

/**
 * The tags most often found alongside `tag`, for the tag page's Related Tags section.
 *
 * Ranked by shared posts, then by overall post count, then alphabetically so the order
 * is stable between builds. A tag with a single post gets nothing: its related tags
 * would just repeat the badges on the one post card above.
 */
export function getRelatedTags(posts: Post[], tag: string, limit = 3): RelatedTag[] {
  const postCounts = new Map<string, number>();
  const sharedCounts = new Map<string, number>();

  posts.forEach((post) => {
    const tags = post.tags ?? [];
    tags.forEach((t) => postCounts.set(t, (postCounts.get(t) ?? 0) + 1));

    if (!tags.includes(tag)) return;
    tags
      .filter((t) => t !== tag)
      .forEach((t) => sharedCounts.set(t, (sharedCounts.get(t) ?? 0) + 1));
  });

  if ((postCounts.get(tag) ?? 0) < 2) return [];

  return [...sharedCounts.entries()]
    .map(([t, sharedCount]) => ({ tag: t, sharedCount, postCount: postCounts.get(t) ?? 0 }))
    .sort((a, b) => b.sharedCount - a.sharedCount || b.postCount - a.postCount || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}
