import { Post } from '../../types';
import { filterPostsByPage } from './filterPostsByPage';

export interface PaginatedPosts {
  currentPage: number;
  pageCount: number;
  pagePosts: Post[];
}

export function paginatePosts(
  posts: Post[],
  postsPerPage: number,
  page: number | string = 1,
): PaginatedPosts {
  const currentPage = Number(page);
  const pageCount = Math.ceil(posts.length / postsPerPage);
  const pagePosts = filterPostsByPage(posts, postsPerPage, currentPage);

  return { currentPage, pageCount, pagePosts };
}
