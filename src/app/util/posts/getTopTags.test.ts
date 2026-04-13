import { Post } from '../types';
import { getTopTags } from './getTopTags';

// Fixed reference date: 2026-01-01
const now = new Date('2026-01-01').getTime();

// Recent post: ~0 years ago -> weight ~1.0
const recentDate = new Date('2025-12-01');
// Mid post: ~2 years ago -> weight ~0.33
const midDate = new Date('2024-01-01');
// Old post: ~6 years ago -> weight ~0.14
const oldDate = new Date('2020-01-01');

jest.useFakeTimers().setSystemTime(now);

const posts = [
  { tags: ['old-only'], date: oldDate } as Post,
  { tags: ['old-only'], date: oldDate } as Post,
  { tags: ['old-only'], date: oldDate } as Post,
  { tags: ['recent-only'], date: recentDate } as Post,
  { tags: ['recent-only'], date: recentDate } as Post,
  { tags: ['mixed'], date: recentDate } as Post,
  { tags: ['mixed'], date: oldDate } as Post,
  { tags: ['mixed'], date: oldDate } as Post,
];

describe('getTopTags', () => {
  it('should return an empty array', () => {
    expect(getTopTags([])).toEqual([]);
  });

  it('should include count and smartScore fields', () => {
    const result = getTopTags(posts);
    result.forEach(({ tag, count, smartScore }) => {
      expect(typeof tag).toBe('string');
      expect(typeof count).toBe('number');
      expect(typeof smartScore).toBe('number');
    });
  });

  it('should return correct counts', () => {
    const result = getTopTags(posts);
    const byTag = Object.fromEntries(result.map(t => [t.tag, t]));
    expect(byTag['old-only'].count).toBe(3);
    expect(byTag['recent-only'].count).toBe(2);
    expect(byTag['mixed'].count).toBe(3);
  });

  it('should sort by smartScore so recent tags outrank older tags with higher raw count', () => {
    const result = getTopTags(posts);
    // recent-only has 2 posts but all recent, old-only has 3 posts but all old
    // recent-only should rank higher than old-only despite lower count
    const recentIdx = result.findIndex(t => t.tag === 'recent-only');
    const oldIdx = result.findIndex(t => t.tag === 'old-only');
    expect(recentIdx).toBeLessThan(oldIdx);
  });

  it('should sort results in descending smartScore order', () => {
    const result = getTopTags(posts);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].smartScore).toBeGreaterThanOrEqual(result[i].smartScore);
    }
  });
});
