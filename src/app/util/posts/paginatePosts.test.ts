import { Post } from '../../types';
import { paginatePosts } from './paginatePosts';

function newPost(slug: string): Post {
  return {
    id: slug,
    title: slug,
    slug,
    contentHtml: '<p>foo</p>',
    date: new Date('2023-12-30'),
    dateFormatted: '30th Dec 2023',
    tags: [],
    imageThumbnailUrl: undefined,
    path: `/post/${slug}`,
    url: `https://www.curtiscode.dev/post/${slug}`,
  };
}

describe('paginatePosts', () => {
  const posts: Array<Post> = Array.from({ length: 25 }, (_, i) => newPost(`post-${i}`));

  it('defaults to page 1 when no page is given', () => {
    const result = paginatePosts(posts, 20);
    expect(result.currentPage).toBe(1);
    expect(result.pagePosts).toEqual(posts.slice(0, 20));
  });

  it('computes pageCount from the total posts and postsPerPage', () => {
    const result = paginatePosts(posts, 20);
    expect(result.pageCount).toBe(2);
  });

  it('accepts a numeric page', () => {
    const result = paginatePosts(posts, 20, 2);
    expect(result.currentPage).toBe(2);
    expect(result.pagePosts).toEqual(posts.slice(20, 25));
  });

  it('accepts a string page, coercing it to a number', () => {
    const result = paginatePosts(posts, 20, '2');
    expect(result.currentPage).toBe(2);
    expect(result.pagePosts).toEqual(posts.slice(20, 25));
  });

  it('returns an empty pagePosts array for a page beyond the last', () => {
    const result = paginatePosts(posts, 20, 3);
    expect(result.currentPage).toBe(3);
    expect(result.pagePosts).toEqual([]);
  });

  it('handles an empty posts array', () => {
    const result = paginatePosts([], 20);
    expect(result).toEqual({ currentPage: 1, pageCount: 0, pagePosts: [] });
  });
});
