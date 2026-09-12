import { Post } from '../../types/Post';
import { filterPostsByTag } from './filterPostsByTag';

const makePost = (slug: string, tags: Array<string>): Post => ({
  id: slug,
  title: slug,
  slug,
  contentHtml: '',
  date: new Date('2021-01-30'),
  dateFormatted: '30th Jan 2021',
  tags,
  imageThumbnailUrl: undefined,
  path: `/post/${slug}`,
  url: `https://www.curtiscode.dev/post/${slug}`,
});

// filterPostsByTag guards with `post.tags &&` for legacy posts that have no
// tags field at all — a shape the Post type no longer permits, hence the cast.
const untaggedPost = { ...makePost('d', []), tags: undefined } as unknown as Post;

describe('filterPostsByTag', () => {
  const posts: Array<Post> = [
    makePost('a', ['foo']),
    makePost('b', ['bar']),
    makePost('c', ['foo', 'bar']),
    untaggedPost,
  ];

  it('should return correct posts', () => {
    expect(filterPostsByTag(posts, 'foo')).toEqual([
      makePost('a', ['foo']),
      makePost('c', ['foo', 'bar']),
    ]);
  });
});
