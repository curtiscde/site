import { Post } from '../types/Post';
import { filterPostsByTag } from './filterPostsByTag';

describe('filterPostsByTag', () => {
  const posts: Array<Post> = [
    {
      title: 'a', date: new Date('2021-01-30'), slug: 'a', tags: ['foo'],
    },
    {
      title: 'b', date: new Date('2021-01-30'), slug: 'b', tags: ['bar'],
    },
    {
      title: 'c', date: new Date('2021-01-30'), slug: 'c', tags: ['foo', 'bar'],
    },
    { title: 'd', date: new Date('2021-01-30'), slug: 'd' },
  ];

  it('should return correct posts', () => {
    expect(filterPostsByTag(posts, 'foo')).toEqual([
      {
        title: 'a', date: new Date('2021-01-30'), slug: 'a', tags: ['foo'],
      },
      {
        title: 'c', date: new Date('2021-01-30'), slug: 'c', tags: ['foo', 'bar'],
      },
    ]);
  });
});
