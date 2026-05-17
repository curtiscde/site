import { parsePosts, ContentFile } from './getPosts';

function makeFile(slug: string, date: string, overrides: string = ''): ContentFile {
  return {
    filename: `posts/2024/2024-${slug}.md`,
    content: `---
id: "test-${slug}"
title: "${slug}"
slug: "${slug}"
tags:
  - test
date: ${date}T00:00:00
${overrides}
---

# ${slug}`,
  };
}

describe('parsePosts', () => {
  it('parses a valid markdown file into a Post', () => {
    const posts = parsePosts([makeFile('hello', '2024-03-15')]);
    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe('hello');
    expect(posts[0].title).toBe('hello');
  });

  it('sorts posts by date descending', () => {
    const files = [
      makeFile('older', '2024-01-01'),
      makeFile('newer', '2024-06-15'),
      makeFile('middle', '2024-03-10'),
    ];
    expect(parsePosts(files).map(p => p.slug)).toEqual(['newer', 'middle', 'older']);
  });

  it('skips files that fail schema validation', () => {
    const invalid: ContentFile = { filename: 'posts/bad.md', content: 'no frontmatter at all' };
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const posts = parsePosts([makeFile('valid', '2024-03-15'), invalid]);
    consoleSpy.mockRestore();
    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe('valid');
  });

  it('logs the filename when a file fails to parse', () => {
    const invalid: ContentFile = { filename: 'posts/broken.md', content: 'no frontmatter' };
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    parsePosts([invalid]);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('posts/broken.md'),
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it('converts markdown body to HTML', () => {
    const posts = parsePosts([makeFile('hello', '2024-03-15')]);
    expect(posts[0].contentHtml).toContain('<h1>hello</h1>');
  });

  it('generates path and url from slug', () => {
    const posts = parsePosts([makeFile('my-post', '2024-03-15')]);
    expect(posts[0].path).toBe('/post/my-post');
    expect(posts[0].url).toBe('https://www.curtiscode.dev/post/my-post');
  });

  it('returns an empty array for an empty input', () => {
    expect(parsePosts([])).toEqual([]);
  });

  it('passes through optional description and image', () => {
    const file = makeFile('my-post', '2024-03-15', 'description: "A post"\nimage: /cover.jpg');
    const posts = parsePosts([file]);
    expect(posts[0].description).toBe('A post');
    expect(posts[0].imageThumbnailUrl).toBe('/cover.jpg');
  });
});
