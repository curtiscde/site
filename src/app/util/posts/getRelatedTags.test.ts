import { Post } from '../../types';
import { getRelatedTags } from './getRelatedTags';

function newPost(slug: string, tags: Array<string>): Post {
  return {
    id: slug,
    title: slug,
    slug,
    contentHtml: '<p>foo</p>',
    date: new Date('2024-01-01'),
    dateFormatted: '1st Jan 2024',
    tags,
    imageThumbnailUrl: undefined,
    path: `/post/${slug}`,
    url: `https://www.curtiscode.dev/post/${slug}`,
  };
}

describe('getRelatedTags', () => {
  it('ranks tags by how many posts they share with the tag', () => {
    const posts = [
      newPost('1', ['javascript', 'react', 'css']),
      newPost('2', ['javascript', 'react']),
      newPost('3', ['javascript', 'css', 'react']),
      newPost('4', ['javascript', 'jest']),
    ];

    expect(getRelatedTags(posts, 'javascript')).toEqual([
      { tag: 'react', sharedCount: 3, postCount: 3 },
      { tag: 'css', sharedCount: 2, postCount: 2 },
      { tag: 'jest', sharedCount: 1, postCount: 1 },
    ]);
  });

  it('breaks a tie in shared posts by the tag with more posts overall', () => {
    const posts = [
      newPost('1', ['javascript', 'css']),
      newPost('2', ['javascript', 'react']),
      newPost('3', ['react']),
    ];

    expect(getRelatedTags(posts, 'javascript').map(({ tag }) => tag)).toEqual(['react', 'css']);
  });

  it('breaks a full tie alphabetically, so the order is stable between builds', () => {
    const posts = [
      newPost('1', ['javascript', 'vue']),
      newPost('2', ['javascript', 'angular']),
    ];

    expect(getRelatedTags(posts, 'javascript').map(({ tag }) => tag)).toEqual(['angular', 'vue']);
  });

  it('returns at most three tags by default', () => {
    const posts = [
      newPost('1', ['javascript', 'a', 'b']),
      newPost('2', ['javascript', 'c', 'd']),
    ];

    expect(getRelatedTags(posts, 'javascript')).toHaveLength(3);
  });

  it('respects a custom limit', () => {
    const posts = [
      newPost('1', ['javascript', 'a', 'b']),
      newPost('2', ['javascript', 'c', 'd']),
    ];

    expect(getRelatedTags(posts, 'javascript', 2)).toHaveLength(2);
  });

  /**
   * A tag with one post would only repeat that post's own tags, which its card already
   * shows a few pixels above. That's 120 of the ~150 tags, so this is the common case.
   */
  it('returns nothing for a tag with a single post', () => {
    const posts = [
      newPost('1', ['warp', 'terminal', 'github']),
      newPost('2', ['terminal']),
    ];

    expect(getRelatedTags(posts, 'warp')).toEqual([]);
  });

  it('returns nothing when the tag never shares a post', () => {
    const posts = [
      newPost('1', ['javascript']),
      newPost('2', ['javascript']),
    ];

    expect(getRelatedTags(posts, 'javascript')).toEqual([]);
  });

  it('returns nothing for an unknown tag', () => {
    expect(getRelatedTags([newPost('1', ['javascript'])], 'nope')).toEqual([]);
  });

  it('copes with posts that have no tags', () => {
    const posts = [
      { ...newPost('1', []), tags: undefined } as unknown as Post,
      newPost('2', ['javascript', 'react']),
      newPost('3', ['javascript', 'react']),
    ];

    expect(getRelatedTags(posts, 'javascript')).toEqual([{ tag: 'react', sharedCount: 2, postCount: 2 }]);
  });
});
