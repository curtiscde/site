import { Post } from '../types';
import { getTopTags } from './getTopTags';

const posts = [
  { tags: ['bar'] } as Post,
  { tags: ['foo'] } as Post,
  { tags: ['foo'] } as Post,
  { tags: ['foo', 'bar', 'baz'] } as Post,
  { tags: ['foo', 'bar', 'baz', 'qux'] } as Post,
  { tags: ['foo', 'bar', 'baz', 'qux', 'quux'] } as Post,
  { tags: ['foo', 'bar', 'baz', 'qux', 'quux', 'quuz'] } as Post,
];

describe('getTopTags', () => {
  it('should return an empty array', () => {
    expect(getTopTags([])).toEqual([]);
  });

  it('should return tags with correct count', () => {
    expect(getTopTags(posts)).toEqual([
      { tag: 'foo', count: 6 },
      { tag: 'bar', count: 5 },
      { tag: 'baz', count: 4 },
      { tag: 'qux', count: 3 },
      { tag: 'quux', count: 2 },
      { tag: 'quuz', count: 1 },
    ]);
  });
});
