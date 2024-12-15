import { Post } from '../../types/Post';

export function filterPostsByTag(posts: Post[], tag: string) {
  return posts.filter((post) => post.tags && post.tags.find((postTag) => postTag === tag));
}
