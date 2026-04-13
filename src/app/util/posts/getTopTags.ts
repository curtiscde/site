import { Post, TagCount } from '../../types';

export function getTopTags(posts: Array<Post>): TagCount[] {
  const now = Date.now();
  const msPerYear = 1000 * 60 * 60 * 24 * 365.25;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tags = posts.reduce((acc: any, current: Post) => {
    const t = { ...acc };
    if (current.tags) {
      const yearsAgo = (now - current.date.getTime()) / msPerYear;
      const weight = 1 / (1 + yearsAgo);
      current.tags.forEach((tag) => {
        if (!t[tag]) t[tag] = { count: 0, smartScore: 0 };
        t[tag].count += 1;
        t[tag].smartScore += weight;
      });
    }

    return t;
  }, {});

  return Object.entries(tags)
    .map(([tag, value]) => ({
      tag,
      count: (value as { count: number; smartScore: number }).count,
      smartScore: (value as { count: number; smartScore: number }).smartScore,
    }))
    .sort((a, b) => b.smartScore - a.smartScore);
}
