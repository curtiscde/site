import { Post } from '../../types';

export function filterPostsByPage(posts: Array<Post>, postsPerPage: number, page: number) {
  const start = (page - 1) * postsPerPage;
  const end = start + postsPerPage;
  return posts.slice(start, end);
}
