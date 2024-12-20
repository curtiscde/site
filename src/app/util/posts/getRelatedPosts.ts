import { Post } from '../../types';

export function getRelatedPosts(posts: Post[], post: Post): Post[] {
  if (!post.tags || !post.tags.length) return [];

  return posts
    .filter((p) => p.slug !== post.slug)
    .filter((p) => Boolean(p.imageThumbnailUrl))
    .filter((p) => p.tags && p.tags.some((t) => post.tags!.includes(t)))
    .slice(0, 3);
}
