import { Post } from '../../types/Post';
import { filterPostsByPage } from './filterPostsByPage';

const makePost = (slug: string): Post => ({
  id: slug,
  title: slug,
  slug,
  contentHtml: '',
  date: new Date('2021-01-30'),
  dateFormatted: '30th Jan 2021',
  tags: [],
  imageThumbnailUrl: undefined,
  path: `/post/${slug}`,
  url: `https://www.curtiscode.dev/post/${slug}`,
});

describe('getPostsByPage', () => {
  const posts: Array<Post> = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map(makePost);

  it('page 1 should return correct posts', () => {
    expect(filterPostsByPage(posts, 4, 1)).toEqual([
      makePost('a'),
      makePost('b'),
      makePost('c'),
      makePost('d'),
    ]);
  });

  it('page 2 should return correct posts', () => {
    expect(filterPostsByPage(posts, 4, 2)).toEqual([
      makePost('e'),
      makePost('f'),
      makePost('g'),
      makePost('h'),
    ]);
  });

  it('page 3 should return correct posts', () => {
    expect(filterPostsByPage(posts, 4, 3)).toEqual([
      makePost('i'),
      makePost('j'),
    ]);
  });
});
