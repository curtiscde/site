import { transformPost, getOrdinalSuffix, RawPost } from './Post';

const basePost: RawPost = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test Post',
  slug: 'test-post',
  tags: ['foo', 'bar'],
  date: new Date('2024-03-15'),
  content: '# Hello\n\nWorld',
};

describe('getOrdinalSuffix', () => {
  it.each([
    [1, 'st'], [2, 'nd'], [3, 'rd'],
    [4, 'th'], [11, 'th'], [12, 'th'], [13, 'th'],
    [21, 'st'], [22, 'nd'], [23, 'rd'], [24, 'th'],
  ])('day %i returns "%s"', (day, expected) => {
    expect(getOrdinalSuffix(day)).toBe(expected);
  });
});

describe('transformPost', () => {
  const post = transformPost(basePost);

  it('generates path from slug', () => {
    expect(post.path).toBe('/post/test-post');
  });

  it('generates url from config and path', () => {
    expect(post.url).toBe('https://www.curtiscode.dev/post/test-post');
  });

  it('converts markdown content to HTML', () => {
    expect(post.contentHtml).toContain('<h1>Hello</h1>');
    expect(post.contentHtml).toContain('<p>World</p>');
  });

  it('formats date with ordinal suffix and short month', () => {
    expect(post.dateFormatted).toBe('15th Mar 2024');
  });

  it('renames image field to imageThumbnailUrl', () => {
    const withImage = transformPost({ ...basePost, image: '/post/test/cover.jpg' });
    expect(withImage.imageThumbnailUrl).toBe('/post/test/cover.jpg');
    expect('image' in withImage).toBe(false);
  });

  it('passes undefined imageThumbnailUrl when image is absent', () => {
    expect(post.imageThumbnailUrl).toBeUndefined();
  });

  it('passes through optional description and author', () => {
    const withOptionals = transformPost({ ...basePost, description: 'A description', author: 'Curtis' });
    expect(withOptionals.description).toBe('A description');
    expect(withOptionals.author).toBe('Curtis');
  });
});
