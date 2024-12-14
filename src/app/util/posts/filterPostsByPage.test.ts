import { Post } from '../types/Post';
import { filterPostsByPage } from './filterPostsByPage';

describe('getPostsByPage', () => {
  const posts: Array<Post> = [
    { title: 'a', date: new Date('2021-01-30'), slug: 'a' },
    { title: 'b', date: new Date('2021-01-30'), slug: 'b' },
    { title: 'c', date: new Date('2021-01-30'), slug: 'c' },
    { title: 'd', date: new Date('2021-01-30'), slug: 'd' },
    { title: 'e', date: new Date('2021-01-30'), slug: 'e' },
    { title: 'f', date: new Date('2021-01-30'), slug: 'f' },
    { title: 'g', date: new Date('2021-01-30'), slug: 'g' },
    { title: 'h', date: new Date('2021-01-30'), slug: 'h' },
    { title: 'i', date: new Date('2021-01-30'), slug: 'i' },
    { title: 'j', date: new Date('2021-01-30'), slug: 'j' },
  ];

  it('page 1 should return correct posts', () => {
    expect(filterPostsByPage(posts, 4, 1)).toEqual([
      { title: 'a', date: new Date('2021-01-30'), slug: 'a' },
      { title: 'b', date: new Date('2021-01-30'), slug: 'b' },
      { title: 'c', date: new Date('2021-01-30'), slug: 'c' },
      { title: 'd', date: new Date('2021-01-30'), slug: 'd' },
    ]);
  });

  it('page 2 should return correct posts', () => {
    expect(filterPostsByPage(posts, 4, 2)).toEqual([
      { title: 'e', date: new Date('2021-01-30'), slug: 'e' },
      { title: 'f', date: new Date('2021-01-30'), slug: 'f' },
      { title: 'g', date: new Date('2021-01-30'), slug: 'g' },
      { title: 'h', date: new Date('2021-01-30'), slug: 'h' },
    ]);
  });

  it('page 3 should return correct posts', () => {
    expect(filterPostsByPage(posts, 4, 3)).toEqual([
      { title: 'i', date: new Date('2021-01-30'), slug: 'i' },
      { title: 'j', date: new Date('2021-01-30'), slug: 'j' },
    ]);
  });
});
