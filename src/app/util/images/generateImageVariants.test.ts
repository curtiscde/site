/**
 * @jest-environment node
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { generateImageVariants } from '../../../../scripts/generate-image-variants.mjs'

// Drives the generator the way `npm run images` and CI do: point it at a public/ tree,
// run it, and inspect what it reports and what it left on disk.

let root: string

async function writeImage(rel: string, width: number, format: 'png' | 'jpeg' | 'gif', seed = 0) {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  await sharp({
    create: { width, height: 20, channels: 3, background: { r: seed, g: 100, b: 150 } },
  })
    .toFormat(format)
    .toFile(file)
}

/** Every file under the tree, relative to root, with its bytes — for "nothing changed" checks. */
function snapshot(): Record<string, string> {
  const out: Record<string, string> = {}
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) visit(full)
      else out[path.relative(root, full)] = fs.readFileSync(full).toString('base64')
    }
  }
  visit(root)
  return out
}

beforeEach(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'img-variants-'))
  await writeImage('post/a/cover.png', 250, 'png')
  await writeImage('images/photo.jpeg', 120, 'jpeg')
  await writeImage('post/a/anim.gif', 30, 'gif')
})

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

describe('generate', () => {
  it('encodes every raster on a first run and reuses all of them on the next', async () => {
    const first = await generateImageVariants({ root })
    expect(first).toMatchObject({ encoded: 2, reused: 0, measured: 1 })
    expect(fs.existsSync(path.join(root, '_img/post/a/cover-200.avif'))).toBe(true)
    expect(fs.existsSync(path.join(root, '_img/post/a/cover-250.webp'))).toBe(true)

    const before = snapshot()
    const second = await generateImageVariants({ root })

    expect(second).toMatchObject({ encoded: 0, reused: 2, measured: 1 })
    expect(snapshot()).toEqual(before)
  })

  it('removes the variants and entry of a deleted source', async () => {
    await generateImageVariants({ root })
    fs.rmSync(path.join(root, 'post/a/cover.png'))

    const result = await generateImageVariants({ root })

    expect(result.removed).toBe(6)
    expect(fs.existsSync(path.join(root, '_img/post/a'))).toBe(false)
    const manifest = JSON.parse(fs.readFileSync(path.join(root, '_img/manifest.json'), 'utf8'))
    expect(Object.keys(manifest)).toEqual(['/images/photo.jpeg', '/post/a/anim.gif'])
    expect((await generateImageVariants({ root, check: true })).discrepancies).toEqual([])
  })

  it('moves variants along with a renamed source', async () => {
    await generateImageVariants({ root })
    fs.renameSync(path.join(root, 'images/photo.jpeg'), path.join(root, 'images/portrait.jpeg'))

    await generateImageVariants({ root })

    expect(fs.readdirSync(path.join(root, '_img/images')).sort()).toEqual([
      'portrait-120.avif',
      'portrait-120.webp',
      'portrait-96.avif',
      'portrait-96.webp',
    ])
    expect((await generateImageVariants({ root, check: true })).discrepancies).toEqual([])
  })
})

describe('check', () => {
  beforeEach(async () => {
    await generateImageVariants({ root })
  })

  it('reports nothing for a tree that is in sync', async () => {
    const result = await generateImageVariants({ root, check: true })

    expect(result.discrepancies).toEqual([])
  })

  it('reports a source with no manifest entry as missing, without writing anything', async () => {
    await writeImage('post/b/new.png', 90, 'png')
    const before = snapshot()

    const result = await generateImageVariants({ root, check: true })

    expect(result.discrepancies).toEqual([{ kind: 'missing', src: '/post/b/new.png' }])
    expect(snapshot()).toEqual(before)
  })

  it('reports a source whose bytes changed as stale', async () => {
    await writeImage('post/a/cover.png', 250, 'png', 200)

    const result = await generateImageVariants({ root, check: true })

    expect(result.discrepancies).toEqual([{ kind: 'stale', src: '/post/a/cover.png' }])
  })

  it('reports an entry whose variant files are not all on disk as incomplete', async () => {
    fs.rmSync(path.join(root, '_img/post/a/cover-96.webp'))

    const result = await generateImageVariants({ root, check: true })

    expect(result.discrepancies).toEqual([{ kind: 'incomplete', src: '/post/a/cover.png' }])
  })

  it('reports every encoded entry written under a different encoder config', async () => {
    // What a committed manifest looks like after someone edits the width ladder or
    // qualities, or bumps sharp, without regenerating.
    const manifestPath = path.join(root, '_img/manifest.json')
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    for (const entry of Object.values<{ config?: string }>(manifest)) {
      if (entry.config) entry.config = 'old-config'
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

    const result = await generateImageVariants({ root, check: true })

    expect(result.discrepancies).toEqual([
      { kind: 'config', src: '/images/photo.jpeg' },
      { kind: 'config', src: '/post/a/cover.png' },
    ])
  })

  it('reports the manifest entry and variant files left behind by a deleted source', async () => {
    fs.rmSync(path.join(root, 'post/a/cover.png'))

    const result = await generateImageVariants({ root, check: true })

    expect(result.discrepancies).toEqual([
      { kind: 'orphan-entry', src: '/post/a/cover.png' },
      { kind: 'orphan-file', src: '/_img/post/a/cover-200.avif' },
      { kind: 'orphan-file', src: '/_img/post/a/cover-200.webp' },
      { kind: 'orphan-file', src: '/_img/post/a/cover-250.avif' },
      { kind: 'orphan-file', src: '/_img/post/a/cover-250.webp' },
      { kind: 'orphan-file', src: '/_img/post/a/cover-96.avif' },
      { kind: 'orphan-file', src: '/_img/post/a/cover-96.webp' },
    ])
  })

  it('reports a GIF whose dimensions changed as stale', async () => {
    await writeImage('post/a/anim.gif', 45, 'gif')

    const result = await generateImageVariants({ root, check: true })

    expect(result.discrepancies).toEqual([{ kind: 'stale', src: '/post/a/anim.gif' }])
  })
})
