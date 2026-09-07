import fs from 'node:fs'
import path from 'node:path'
import { variantUrl, variantSrcSet } from './urls'
import type { ImageManifest } from './manifest'

describe('variantUrl', () => {
  it('places the variant under /_img, mirroring the original path', () => {
    expect(variantUrl('/post/2026/example/shot.png', 800, 'webp')).toBe(
      '/_img/post/2026/example/shot-800.webp'
    )
  })

  it('replaces the original extension rather than appending to it', () => {
    expect(variantUrl('/images/curtis.jpeg', 400, 'avif')).toBe('/_img/images/curtis-400.avif')
  })

  it('handles a file at the root', () => {
    expect(variantUrl('/cover.png', 400, 'webp')).toBe('/_img/cover-400.webp')
  })

  it('handles a name with dots in it', () => {
    expect(variantUrl('/a/my.image.v2.png', 800, 'webp')).toBe('/_img/a/my.image.v2-800.webp')
  })
})

describe('variantSrcSet', () => {
  it('emits width descriptors in the order given', () => {
    expect(variantSrcSet('/a/b.png', [400, 800], 'avif')).toBe(
      '/_img/a/b-400.avif 400w, /_img/a/b-800.avif 800w'
    )
  })

  it('is empty for no widths', () => {
    expect(variantSrcSet('/a/b.png', [], 'avif')).toBe('')
  })
})

// The generator writes URLs; this module derives them. If the two ever disagree, every
// <source> on the site points at a file that does not exist — so check the real manifest
// rather than trusting that the two string templates stayed in step.
describe('agreement with the generated manifest', () => {
  const manifestPath = path.join(process.cwd(), 'public', '_img', 'manifest.json')
  const exists = fs.existsSync(manifestPath)

  // Skipped rather than failed when the manifest is absent: `npm test` on a fresh clone
  // runs before any `npm run images`, and CI's coverage job never builds.
  const maybe = exists ? it : it.skip

  maybe('derives exactly the URLs the generator wrote, for every image', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as ImageManifest
    const entries = Object.entries(manifest)
    expect(entries.length).toBeGreaterThan(0)

    for (const [src, entry] of entries) {
      // Measure-only entries (GIFs) carry dimensions but no variants.
      if (entry.variants === undefined) continue
      for (const format of ['avif', 'webp'] as const) {
        for (const [width, url] of entry.variants[format]) {
          expect(variantUrl(src, width, format)).toBe(url)
        }
      }
    }
  })

  // A CSS background cannot use <picture>, so Hero.scss hardcodes its variant URLs
  // instead of deriving them. That bypasses every guard above, and the failure is silent:
  // once image-set() parses, the browser has discarded the earlier url() declaration, so a
  // 404 leaves no background at all rather than falling back. Swapping the source image
  // for a narrower one would be enough to cause it.
  maybe('has every /_img path that a stylesheet hardcodes', () => {
    const stylesheets = fs
      .readdirSync(path.join(process.cwd(), 'src', 'app', 'components'), { recursive: true })
      .filter((f) => typeof f === 'string' && f.endsWith('.scss'))
      .map((f) => path.join(process.cwd(), 'src', 'app', 'components', f as string))

    const referenced = stylesheets.flatMap((file) =>
      Array.from(fs.readFileSync(file, 'utf8').matchAll(/\/_img\/[^)"'\s]+/g), (m) => m[0])
    )

    // Guards the regex itself: if the SCSS is reformatted so nothing matches, this test
    // would otherwise pass vacuously forever.
    expect(referenced.length).toBeGreaterThan(0)

    for (const url of referenced) {
      expect(fs.existsSync(path.join(process.cwd(), 'public', url))).toBe(true)
    }
  })

  maybe('points at files that exist on disk', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as ImageManifest
    for (const [src, entry] of Object.entries(manifest)) {
      if (entry.variants === undefined) continue
      const widths = entry.variants.webp.map(([w]) => w)
      const url = variantUrl(src, widths[widths.length - 1], 'webp')
      expect(fs.existsSync(path.join(process.cwd(), 'public', url))).toBe(true)
    }
  })
})
