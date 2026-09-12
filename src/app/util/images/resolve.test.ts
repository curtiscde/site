import fs from 'node:fs'
import path from 'node:path'
import { resolveImage } from './resolve'
import { resetImageManifestCache } from './manifest'

describe('resolveImage', () => {
  beforeEach(resetImageManifestCache)

  it('returns undefined for no src, so an optional image needs no guard at the call site', () => {
    expect(resolveImage(undefined)).toBeUndefined()
  })

  it('returns undefined for a src the generator never processed', () => {
    // An SVG, a remote URL, or a file sharp could not read. This is the signal PostImage
    // uses to fall back to a plain <img> of the original.
    expect(resolveImage('/images/logos/tesco.svg')).toBeUndefined()
    expect(resolveImage('https://example.com/remote.png')).toBeUndefined()
    expect(resolveImage('/nothing/here.png')).toBeUndefined()
  })

  describe('against the real generated manifest', () => {
    const manifestPath = path.join(process.cwd(), 'public', '_img', 'manifest.json')
    // Skipped, not failed, when absent: `npm test` on a fresh clone runs before any
    // `npm run images`, and the coverage job never builds.
    const maybe = fs.existsSync(manifestPath) ? it : it.skip

    maybe('resolves the avatar with a rung small enough for its 40px slot', () => {
      const avatar = resolveImage('/images/curtis.png')

      expect(avatar).toBeDefined()
      expect(avatar!.width).toBe(600)
      expect(avatar!.height).toBe(600)
      // The regression this guards: before the 96 and 200 rungs existed the smallest
      // candidate was 400w, ten times the slot and 10.9 KB instead of 1.8 KB.
      expect(avatar!.widths[0]).toBeLessThanOrEqual(96)
    })

    maybe('resolves a CV logo with a rung small enough for its 56px tile', () => {
      const logo = resolveImage('/images/logos/next.png')

      expect(logo).toBeDefined()
      expect(logo!.widths[0]).toBeLessThanOrEqual(200)
    })

    maybe('returns ascending widths, which is what srcset needs', () => {
      const { widths } = resolveImage('/images/curtis.png')!

      expect([...widths].sort((a, b) => a - b)).toEqual(widths)
    })
  })
})
