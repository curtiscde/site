import { renderPicture, ARTICLE_SIZES } from './picture';
import type { ImageManifest } from './manifest';

const manifest: ImageManifest = {
  '/post/2026/example/screenshot.png': {
    hash: 'abc123',
    width: 2488,
    height: 1642,
    variants: {
      avif: [
        [400, '/_img/post/2026/example/screenshot-400.avif'],
        [800, '/_img/post/2026/example/screenshot-800.avif'],
      ],
      webp: [
        [400, '/_img/post/2026/example/screenshot-400.webp'],
        [800, '/_img/post/2026/example/screenshot-800.webp'],
      ],
    },
  },
}

const render = (src: string, alt: string) => renderPicture({ src, alt, manifest })

describe('renderPicture', () => {
  it('offers AVIF before WebP, so the browser prefers AVIF where supported', () => {
    const html = render('/post/2026/example/screenshot.png', 'A screenshot')

    expect(html.indexOf('type="image/avif"')).toBeLessThan(html.indexOf('type="image/webp"'))
  })

  it('builds a width-descriptor srcset for each format', () => {
    const html = render('/post/2026/example/screenshot.png', 'A screenshot')

    expect(html).toContain(
      'srcset="/_img/post/2026/example/screenshot-400.avif 400w, /_img/post/2026/example/screenshot-800.avif 800w"'
    )
    expect(html).toContain(`sizes="${ARTICLE_SIZES}"`)
  })

  it('sets intrinsic width and height from the manifest, which is what prevents layout shift', () => {
    const html = render('/post/2026/example/screenshot.png', 'A screenshot')

    expect(html).toContain('width="2488"')
    expect(html).toContain('height="1642"')
  })

  it('points data-full at the untouched original for the phase 3 lightbox', () => {
    const html = render('/post/2026/example/screenshot.png', 'A screenshot')

    expect(html).toContain('data-full="/post/2026/example/screenshot.png"')
  })

  it('lazy-loads and decodes asynchronously', () => {
    const html = render('/post/2026/example/screenshot.png', 'A screenshot')

    expect(html).toContain('loading="lazy"')
    expect(html).toContain('decoding="async"')
  })

  describe('captions', () => {
    it('renders the alt text as a visible caption when the markdown supplies one', () => {
      const html = render('/post/2026/example/screenshot.png', 'A screenshot')

      expect(html).toContain('<figcaption aria-hidden="true">A screenshot</figcaption>')
    })

    it('hides the caption from assistive tech, which already announces it as alt', () => {
      const html = render('/post/2026/example/screenshot.png', 'A screenshot')

      // Announced twice would be worse than not shown at all.
      expect(html).toContain('alt="A screenshot"')
      expect(html).toContain('<figcaption aria-hidden="true">')
    })

    it('omits the caption entirely when the alt text is empty', () => {
      const html = render('/post/2026/example/screenshot.png', '')

      expect(html).not.toContain('figcaption')
      expect(html).toContain('alt=""')
    })

    it('still wraps in a figure when there is no caption, for consistent styling', () => {
      const html = render('/post/2026/example/screenshot.png', '')

      expect(html.startsWith('<figure>')).toBe(true)
      expect(html.endsWith('</figure>')).toBe(true)
    })
  })

  describe('sources with no variants', () => {
    it('degrades to a plain img rather than emitting a broken source', () => {
      const html = render('/post/2017/example/animation.gif', 'An animation')

      expect(html).not.toContain('<picture>')
      expect(html).toContain('<img src="/post/2017/example/animation.gif"')
      expect(html).toContain('loading="lazy"')
    })

    it('still reserves layout space when the generator measured the source', () => {
      // GIFs are measured but never re-encoded. Without the dimensions they would be the
      // only images on the site that shift the layout as they load — and they are among
      // the largest files in the content set.
      const html = renderPicture({
        src: '/post/2017/example/measured.gif',
        alt: 'An animation',
        manifest: {
          '/post/2017/example/measured.gif': { hash: 'def456', width: 416, height: 154 },
        },
      })

      expect(html).not.toContain('<picture>')
      expect(html).toContain('width="416"')
      expect(html).toContain('height="154"')
    })

    it('keeps the caption behaviour of a processed image', () => {
      expect(render('/nope.gif', 'Caption')).toContain('<figcaption aria-hidden="true">Caption</figcaption>')
      expect(render('/nope.gif', '')).not.toContain('figcaption')
    })
  })

  describe('escaping', () => {
    it('escapes quotes and angle brackets in alt text so it cannot break out of the attribute', () => {
      const html = render('/post/2026/example/screenshot.png', 'He said "hi" <script>alert(1)</script>')

      expect(html).not.toContain('<script>')
      expect(html).toContain('&quot;hi&quot;')
      expect(html).toContain('&lt;script&gt;')
    })

    it('escapes ampersands in the source path', () => {
      const html = render('/img/a&b.gif', 'x')

      expect(html).toContain('/img/a&amp;b.gif')
    })
  })
})
