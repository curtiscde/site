import { Post } from '../../types/Post';

/**
 * The tag page's subtitle line: `15 posts · 2012–2022`.
 *
 * A range rather than "since 2012", so a tag that went quiet years ago says so instead
 * of implying it is still current.
 */
export function formatTagStats(posts: Post[]): string {
  const count = `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`;

  if (posts.length === 0) {
    return count;
  }

  const years = posts.map((post) => post.date.getFullYear());
  const first = Math.min(...years);
  const last = Math.max(...years);
  const range = first === last ? `${first}` : `${first}–${last}`;

  return `${count} · ${range}`;
}
