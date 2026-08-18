import { Post } from '../../types';
import { findPostBySlug } from './findPostBySlug';

function newPost(slug: string): Post {
  return {
    id: slug,
    title: slug,
    slug,
    content: 'foo',
    contentHtml: '<p>foo</p>',
    date: new Date('2023-12-30'),
    dateFormatted: '30th Dec 2023',
    tags: [],
    imageThumbnailUrl: undefined,
    path: `/post/${slug}`,
    url: `https://www.curtiscode.dev/post/${slug}`,
  };
}

describe('findPostBySlug', () => {
  const posts: Array<Post> = [newPost('foo'), newPost('bar'), newPost('baz')];

  it('returns the post matching the given slug', () => {
    expect(findPostBySlug(posts, 'bar')).toEqual(posts[1]);
  });

  it('returns undefined when no post matches the slug', () => {
    expect(findPostBySlug(posts, 'does-not-exist')).toBeUndefined();
  });

  it('returns undefined for an empty posts array', () => {
    expect(findPostBySlug([], 'foo')).toBeUndefined();
  });

  it('is case-sensitive', () => {
    expect(findPostBySlug(posts, 'FOO')).toBeUndefined();
  });
});
