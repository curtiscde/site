import fs from 'node:fs';
import path from 'node:path';
import { transformPost, getOrdinalSuffix, toSummary, RawPost, Post } from './Post';

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

  it('drops the markdown source once it has been rendered', () => {
    // Nothing reads `content` after this point, and leaving it on Post sent every
    // article to the browser twice — once as markdown, once as rendered HTML.
    expect('content' in post).toBe(false);
    expect(post.contentHtml).toContain('<h1>Hello</h1>');
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

  // <figure> is flow content and cannot live inside a <p>. `image` is an inline renderer,
  // so before the `paragraph` override its output landed inside the paragraph that held
  // the image — `<p><figure>...</figure></p>` on 77 of the site's 78 images. Browsers
  // closed the paragraph early and left a stray empty <p> either side of every one.
  describe('block-level images', () => {
    it('does not wrap a lone image in a paragraph', () => {
      const out = html('![A caption](/post/2026/nope/missing.png)')

      expect(out).not.toMatch(/<p>\s*<figure>/)
      expect(out.trim().startsWith('<figure>')).toBe(true)
    })

    it('unwraps a reference-style image too', () => {
      const out = html('![Alt][1]\n\n[1]: /post/2026/nope/missing.png')

      expect(out).not.toMatch(/<p>\s*<figure>/)
    })

    it('unwraps an image wrapped in a link', () => {
      // 2017-moving-wordpress-hugo links its xkcd image out. An <a> is transparent
      // content, so a <figure> inside it is just as invalid inside a <p>.
      const out = html('[![Bobby](/post/2026/nope/missing.png)](https://xkcd.com/327/)')

      expect(out).not.toMatch(/<p>\s*<a/)
      expect(out).toContain('href="https://xkcd.com/327/"')
      expect(out).toContain('<figure>')
    })

    it('still wraps a paragraph that mixes text with an image', () => {
      // Unwrapping this one would leave the prose in no paragraph at all.
      const out = html('Before ![x](/post/2026/nope/missing.png) after')

      expect(out).toMatch(/<p>Before/)
    })

    it('leaves ordinary prose paragraphs alone', () => {
      expect(html('Just some prose.')).toContain('<p>Just some prose.</p>')
    })
  })

  // Every other image test either injects a manifest or uses a deliberately-absent path,
  // so all of them pass whether or not the manifest is actually found on disk. Without
  // this one, a wrong MANIFEST_PATH would leave the whole suite green while every image
  // on the site silently reverted to its full-size original.
  describe('against the real generated manifest', () => {
    const manifestPath = path.join(process.cwd(), 'public', '_img', 'manifest.json')
    // Skipped, not failed, when absent: `npm test` on a fresh clone runs before any
    // `npm run images`, and the coverage job never builds.
    const maybe = fs.existsSync(manifestPath) ? it : it.skip

    // Uses the OG image because it is referenced from layout.tsx metadata, so it
    // cannot quietly disappear the way an image referenced only from CSS can. Its
    // source is 1200px wide, hence the 1200 variant rather than 1600.
    maybe('emits picture markup for an image the generator processed', () => {
      const out = html('![Homepage](/images/curtis-homepage.jpg)')

      expect(out).toContain('<picture>')
      expect(out).toContain('type="image/avif"')
      expect(out).toContain('/_img/images/curtis-homepage-1200.avif')
      expect(out).not.toContain('src="/images/curtis-homepage.jpg"')
    })
  })
})

describe('toSummary', () => {
  const post = transformPost({
    id: '1', title: 'T', slug: 's', date: new Date('2026-01-01T00:00:00'),
    tags: ['a'], content: '# Heading\n\nBody text with `code`.',
  } as RawPost);

  it('drops the rendered body, which no listing card displays', () => {
    expect('contentHtml' in toSummary(post)).toBe(false);
  });

  it('keeps every field a listing card renders', () => {
    const summary = toSummary(post);

    // PostCard reads these; losing any of them silently empties a card.
    for (const field of ['id', 'title', 'tags', 'slug', 'path', 'url', 'date', 'dateFormatted']) {
      expect(summary).toHaveProperty(field);
    }
  });

  it('carries a new Post field through without being edited', () => {
    // Excluding rather than picking is what makes this true, so a rename in Post cannot
    // silently empty a card. The cost is that it is fail-open for payload size — see the
    // note on toSummary.
    const extended = { ...post, somethingNew: 'x' } as unknown as Post;

    expect(toSummary(extended)).toHaveProperty('somethingNew', 'x');
  });

  it('leaves the original post untouched', () => {
    toSummary(post);

    expect(post.contentHtml).toContain('<h1');
  });
});

