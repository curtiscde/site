import { Post } from '../types/Post';
import { getRelatedPosts } from './getRelatedPosts';

function newPost(slug: string, date: string, tags: Array<string>, hasImage: boolean): Post {
  return {
    title: slug, slug, content: 'foo', date: new Date(date), tags, image: hasImage ? '/foo.jpg' : undefined,
  };
}

describe('getRelatedPosts', () => {
  const posts: Array<Post> = [
    newPost('0', '2023-12-30', [], true),
    newPost('1', '2023-12-29', ['foo'], true),
    newPost('2', '2023-12-28', ['foo'], true),
    newPost('3', '2023-12-27', ['foo', 'bar'], true),
    newPost('4', '2023-12-26', ['foo', 'bar'], false),
    newPost('5', '2023-12-25', ['bar'], true),
    newPost('6', '2023-12-25', ['bar'], true),
    newPost('7', '2023-12-25', ['foo', 'bar'], true),
    newPost('8', '2023-12-25', ['foo', 'bar'], true),
    newPost('9', '2023-12-25', ['bar'], true),
  ];

  describe('no tags', () => {
    const post: Post = posts[0];

    it('returns no posts', () => {
      expect(
        getRelatedPosts(posts, post),
      ).toEqual([]);
    });
  });

  describe('has tags', () => {
    const post: Post = posts[3];
    let relatedPosts: Array<Post>;

    beforeAll(() => {
      relatedPosts = getRelatedPosts(posts, post);
    });

    it('returns matching posts', () => {
      expect(relatedPosts).toEqual([
        posts[1], posts[2], posts[5],
      ]);
    });

    it('returns posts with matching tags', () => {
      expect(
        relatedPosts
          .filter((p) => p.tags && p.tags.some((t) => post.tags!.includes(t)))
          .length,
      ).toEqual(relatedPosts.length);
    });

    it('returns only posts with images', () => {
      expect(
        relatedPosts.filter((p) => p.image).length,
      ).toEqual(relatedPosts.length);
    });
  });
});
