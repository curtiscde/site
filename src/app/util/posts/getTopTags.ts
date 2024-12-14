import { Post, TagCount } from '../../types';

export function getTopTags(posts: Array<Post>): TagCount[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tags = posts.reduce((acc: any, current: Post) => {
    const t = { ...acc };
    if (current.tags) {
      current.tags.forEach((tag) => {
        t[tag] = (t[tag] ? t[tag] : 0) + 1;
      });
    }

    return t;
  }, {});

  return Object.entries(tags)
    .map(([tag, count]) => ({
      tag,
      count: Number(count),
    }))
    .sort((a, b) => b.count - a.count);
}
