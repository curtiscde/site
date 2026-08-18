import { Post } from '../../types';

/**
 * Ensures relatedPosts has at least `minimum` entries by backfilling with
 * other posts (excluding the current post and any already present),
 * without mutating the input array.
 */
export function padRelatedPosts(
  relatedPosts: Post[],
  allPosts: Post[],
  post: Post,
  minimum: number = 3,
): Post[] {
  if (relatedPosts.length >= minimum) return relatedPosts;

  const backfill = allPosts
    .filter((p) => !relatedPosts.includes(p) && p.id !== post.id)
    .slice(0, minimum - relatedPosts.length);

  return [...relatedPosts, ...backfill];
}
