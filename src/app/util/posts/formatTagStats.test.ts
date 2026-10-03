import { Post } from '../../types/Post';
import { formatTagStats } from './formatTagStats';

const makePost = (slug: string, date: string): Post => ({
  id: slug,
  title: slug,
  slug,
  contentHtml: '',
  date: new Date(date),
  dateFormatted: '',
  tags: ['foo'],
  imageThumbnailUrl: undefined,
  path: `/post/${slug}`,
  url: `https://www.curtiscode.dev/post/${slug}`,
});

describe('formatTagStats', () => {
  it('gives the post count and the year range', () => {
    const posts = [
      makePost('a', '2022-03-01T00:00:00'),
      makePost('b', '2012-06-01T00:00:00'),
      makePost('c', '2016-01-01T00:00:00'),
    ];
    expect(formatTagStats(posts)).toBe('3 posts · 2012–2022');
  });

  it('collapses the range to one year when every post shares it', () => {
    const posts = [makePost('a', '2024-01-01T00:00:00'), makePost('b', '2024-12-01T00:00:00')];
    expect(formatTagStats(posts)).toBe('2 posts · 2024');
  });

  it('uses the singular for a single post', () => {
    expect(formatTagStats([makePost('a', '2020-05-01T00:00:00')])).toBe('1 post · 2020');
  });

  // Math.min/max over an empty list give Infinity, which would render "0 posts · Infinity–-Infinity".
  it('drops the year range when there are no posts', () => {
    expect(formatTagStats([])).toBe('0 posts');
  });
});
