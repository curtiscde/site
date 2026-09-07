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

describe('transformPost code highlighting', () => {
  const render = (content: string) => transformPost({ ...basePost, content }).contentHtml;

  it('highlights a fenced block at build time', () => {
    const html = render('```js\nconst answer = 42;\n```');
    expect(html).toContain('<code class="hljs language-js">');
    expect(html).toContain('hljs-keyword');
  });

  it('puts the hljs class on <code>, which is what the stylesheet targets', () => {
    expect(render('```js\nconst a = 1;\n```')).toContain('<pre><code class="hljs');
  });

  it.each([
    ['markup', 'xml'],
    ['clike', 'c'],
    ['zsh', 'bash'],
    ['md', 'markdown'],
  ])('maps the legacy language name "%s" to "%s"', (alias, expected) => {
    expect(render(`\`\`\`${alias}\ncontent\n\`\`\``)).toContain(`language-${expected}`);
  });

  it('highlights html, which the old client-side setup never registered', () => {
    const html = render('```html\n<div class="a">hi</div>\n```');
    expect(html).toContain('language-html');
    expect(html).toMatch(/hljs-/);
  });

  it('falls back to auto-detection for an unknown language', () => {
    const html = render('```notalanguage\nconst a = 1;\n```');
    expect(html).toContain('<code class="hljs">');
    expect(html).not.toContain('language-notalanguage');
  });

  it('does not throw on a fence with no language', () => {
    expect(() => render('```\nplain text\n```')).not.toThrow();
    expect(render('```\nplain text\n```')).toContain('<code class="hljs">');
  });

  it('escapes markup so a code block cannot inject HTML', () => {
    const html = render('```js\nconst x = "<script>alert(1)</script>";\n```');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('transformPost images', () => {
  const html = (markdown: string) =>
    transformPost({
      id: '1', title: 'T', slug: 's', date: new Date('2026-01-01T00:00:00'),
      tags: [], content: markdown,
    } as RawPost).contentHtml

  it('renders a markdown image as a figure, not a bare img', () => {
    const out = html('![A caption](/post/2026/nope/missing.png)')

    expect(out).toContain('<figure>')
    expect(out).toContain('<figcaption aria-hidden="true">A caption</figcaption>')
  })

  it('omits the caption when the markdown supplies no alt text', () => {
    expect(html('![](/post/2026/nope/missing.png)')).not.toContain('figcaption')
  })

  it('lazy-loads in-article images', () => {
    expect(html('![x](/post/2026/nope/missing.png)')).toContain('loading="lazy"')
  })

  it('leaves other markdown untouched', () => {
    const out = html('Text with ![alt](/a.png) inline.\n\n## Heading')

    expect(out).toContain('<h2')
    expect(out).toContain('Text with')
  })
})
