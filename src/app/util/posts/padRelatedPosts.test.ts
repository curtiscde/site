import { Post } from '../../types';
import { padRelatedPosts } from './padRelatedPosts';

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

describe('padRelatedPosts', () => {
  const post = newPost('current');
  const related1 = newPost('related-1');
  const related2 = newPost('related-2');
  const other1 = newPost('other-1');
  const other2 = newPost('other-2');
  const other3 = newPost('other-3');

  const allPosts = [post, related1, related2, other1, other2, other3];

  it('leaves relatedPosts unchanged when it already meets the minimum', () => {
    const relatedPosts = [related1, related2, other1];
    expect(padRelatedPosts(relatedPosts, allPosts, post)).toEqual([related1, related2, other1]);
  });

  it('pads relatedPosts up to the minimum using other posts', () => {
    const relatedPosts = [related1];
    const result = padRelatedPosts(relatedPosts, allPosts, post);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(related1);
  });

  it('does not include the current post when padding', () => {
    const relatedPosts: Post[] = [];
    const result = padRelatedPosts(relatedPosts, allPosts, post);

    expect(result.some((p) => p.id === post.id)).toBe(false);
  });

  it('does not duplicate posts already present in relatedPosts', () => {
    const relatedPosts = [related1];
    const result = padRelatedPosts(relatedPosts, allPosts, post);

    const slugs = result.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('returns fewer than the minimum when not enough posts are available', () => {
    const smallPostList = [post, related1];
    const relatedPosts: Post[] = [];
    const result = padRelatedPosts(relatedPosts, smallPostList, post);

    expect(result).toEqual([related1]);
  });

  it('does not mutate the original relatedPosts array', () => {
    const relatedPosts = [related1];
    padRelatedPosts(relatedPosts, allPosts, post);

    expect(relatedPosts).toEqual([related1]);
  });

  it('respects a custom minimum', () => {
    const relatedPosts = [related1];
    const result = padRelatedPosts(relatedPosts, allPosts, post, 2);

    expect(result).toHaveLength(2);
  });
});
