import { upgradeRawImages } from './rawHtml';
import { ARTICLE_SIZES } from './picture';
import type { ImageManifest } from './manifest';

const manifest: ImageManifest = {
  '/post/2015/example/js-bad.jpg': {
    width: 518,
    height: 158,
    variants: {
      avif: [
        [400, '/_img/post/2015/example/js-bad-400.avif'],
        [518, '/_img/post/2015/example/js-bad-518.avif'],
      ],
      webp: [
        [400, '/_img/post/2015/example/js-bad-400.webp'],
        [518, '/_img/post/2015/example/js-bad-518.webp'],
      ],
    },
  },
  '/post/2014/example/jsfiddle.gif': { width: 366, height: 181 },
}

const upgrade = (html: string) => upgradeRawImages(html, { manifest })

// The exact shape the three WordPress-era posts carry.
const WORDPRESS_TAG =
  '<img src="/post/2015/example/js-bad.jpg" alt="js-bad" width="518" height="158" ' +
  'class="alignnone size-full wp-image-224" />'

describe('upgradeRawImages', () => {
  describe('a processed source', () => {
    it('wraps the tag in a picture offering AVIF before WebP', () => {
      const out = upgrade(WORDPRESS_TAG)

      expect(out.startsWith('<picture>')).toBe(true)
      expect(out.endsWith('</picture>')).toBe(true)
      expect(out.indexOf('type="image/avif"')).toBeLessThan(out.indexOf('type="image/webp"'))
    })

    it('builds a width-descriptor srcset for each format', () => {
      const out = upgrade(WORDPRESS_TAG)

      expect(out).toContain(
        'srcset="/_img/post/2015/example/js-bad-400.avif 400w, /_img/post/2015/example/js-bad-518.avif 518w"'
      )
      expect(out).toContain(`sizes="${ARTICLE_SIZES}"`)
    })

    it('points the img fallback at the widest WebP, not the original', () => {
      const out = upgrade(WORDPRESS_TAG)

      expect(out).toContain('src="/_img/post/2015/example/js-bad-518.webp"')
      expect(out).not.toContain('src="/post/2015/example/js-bad.jpg"')
    })

    it('keeps the original reachable as data-full, for the lightbox', () => {
      expect(upgrade(WORDPRESS_TAG)).toContain('data-full="/post/2015/example/js-bad.jpg"')
    })

    it('lazy-loads and decodes asynchronously', () => {
      const out = upgrade(WORDPRESS_TAG)

      expect(out).toContain('loading="lazy"')
      expect(out).toContain('decoding="async"')
    })

    // The WordPress import carries `class` and hand-written dimensions. Dropping them is
    // what the markdown-rewrite alternative would have done; this path must not.
    it('preserves every attribute the author wrote', () => {
      const out = upgrade(WORDPRESS_TAG)

      expect(out).toContain('alt="js-bad"')
      expect(out).toContain('class="alignnone size-full wp-image-224"')
      expect(out).toContain('width="518"')
      expect(out).toContain('height="158"')
    })

    it('does not contradict hand-written dimensions with a second pair', () => {
      const out = upgrade(WORDPRESS_TAG)

      expect(out.match(/width=/g)).toHaveLength(1)
      expect(out.match(/height=/g)).toHaveLength(1)
    })

    it('supplies dimensions from the manifest when the author gave none', () => {
      const out = upgrade('<img src="/post/2015/example/js-bad.jpg" alt="x" />')

      expect(out).toContain('width="518"')
      expect(out).toContain('height="158"')
    })

    it('leaves an author-set loading or decoding alone', () => {
      const out = upgrade('<img src="/post/2015/example/js-bad.jpg" loading="eager" decoding="sync">')

      expect(out).toContain('loading="eager"')
      expect(out).toContain('decoding="sync"')
      expect(out).not.toContain('loading="lazy"')
    })

    // Four of the seven sit inside a paragraph, where a <figure> would close the <p>
    // early and change the rendered document.
    it('emits no figure, so it stays valid inside a paragraph', () => {
      expect(upgrade(WORDPRESS_TAG)).not.toContain('figure')
    })

    it('rewrites the image in place, leaving the surrounding markup alone', () => {
      const out = upgrade(`<strong>BAD:</strong>\n${WORDPRESS_TAG}`)

      expect(out.startsWith('<strong>BAD:</strong>\n<picture>')).toBe(true)
    })

    it('upgrades every image in a block, not just the first', () => {
      const out = upgrade(`${WORDPRESS_TAG}\n${WORDPRESS_TAG}`)

      expect(out.match(/<picture>/g)).toHaveLength(2)
    })

    it('handles single-quoted and unquoted src attributes', () => {
      expect(upgrade("<img src='/post/2015/example/js-bad.jpg'>")).toContain('<picture>')
      expect(upgrade('<img src=/post/2015/example/js-bad.jpg>')).toContain('<picture>')
    })

    it('matches an uppercase tag name', () => {
      expect(upgrade('<IMG SRC="/post/2015/example/js-bad.jpg">')).toContain('<picture>')
    })
  })

  describe('a source the generator measured but did not re-encode', () => {
    const gif = '<img src="/post/2014/example/jsfiddle.gif" alt="jsfiddle" />'

    it('keeps serving the original, which is the only copy there is', () => {
      const out = upgrade(gif)

      expect(out).not.toContain('<picture>')
      expect(out).toContain('src="/post/2014/example/jsfiddle.gif"')
    })

    it('still reserves its layout space from the manifest', () => {
      const out = upgrade(gif)

      expect(out).toContain('width="366"')
      expect(out).toContain('height="181"')
    })
  })

  describe('sources with no manifest entry', () => {
    it('leaves a remote image byte-for-byte alone', () => {
      const tag = '<img src="https://example.com/a.png" alt="remote">'

      expect(upgrade(tag)).toBe(tag)
    })

    it('leaves an img with no src alone', () => {
      const tag = '<img alt="broken">'

      expect(upgrade(tag)).toBe(tag)
    })

    it('returns raw HTML with no images untouched', () => {
      const tag = '<strong>BAD:</strong>'

      expect(upgrade(tag)).toBe(tag)
    })
  })

  describe('escaping', () => {
    // An `&` in a filename reaches this function already escaped as `&amp;`, but the
    // manifest is keyed on the plain path. Without decoding, the lookup misses silently
    // and the original is served.
    it('decodes entities in the src before looking the manifest up', () => {
      const out = upgradeRawImages('<img src="/a&amp;b.png">', {
        manifest: {
          '/a&b.png': {
            width: 10,
            height: 10,
            variants: { avif: [[10, '/_img/a&b-10.avif']], webp: [[10, '/_img/a&b-10.webp']] },
          },
        },
      })

      expect(out).toContain('<picture>')
      expect(out).toContain('data-full="/a&amp;b.png"')
    })
  })
})
