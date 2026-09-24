/**
 * @jest-environment node
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import {
  checkImageVariants,
  generateImageVariants,
} from '../../../../scripts/generate-image-variants.mjs'

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

/** Every file under the tree with its bytes and mtime — for "nothing changed" checks. */
function snapshot(): Record<string, string> {
  const tree: Record<string, string> = {}
  for (const entry of fs.readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const full = path.join(entry.parentPath, entry.name)
    const { mtimeMs } = fs.statSync(full)
    tree[path.relative(root, full)] = `${mtimeMs}:${fs.readFileSync(full).toString('base64')}`
  }
  return tree
}

/** Runs the check, asserting along the way that it touched nothing on disk. */
async function check() {
  const before = snapshot()
  const { problems } = await checkImageVariants({ root })
  expect(snapshot()).toEqual(before)
  return problems
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

  it('offers a source narrower than every rung at its own width only', async () => {
    await writeImage('images/icon.png', 60, 'png')

    await generateImageVariants({ root })

    const manifest = JSON.parse(fs.readFileSync(path.join(root, '_img/manifest.json'), 'utf8'))
    expect(manifest['/images/icon.png'].variants).toEqual({
      avif: [[60, '/_img/images/icon-60.avif']],
      webp: [[60, '/_img/images/icon-60.webp']],
    })
  })

  it('removes the variants and entry of a deleted source', async () => {
    await generateImageVariants({ root })
    fs.rmSync(path.join(root, 'post/a/cover.png'))

    const result = await generateImageVariants({ root })

    expect(result.removed).toBe(6)
    expect(fs.existsSync(path.join(root, '_img/post/a'))).toBe(false)
    const manifest = JSON.parse(fs.readFileSync(path.join(root, '_img/manifest.json'), 'utf8'))
    expect(Object.keys(manifest)).toEqual(['/images/photo.jpeg', '/post/a/anim.gif'])
    expect(await check()).toEqual([])
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
    expect(await check()).toEqual([])
  })
})

describe('check', () => {
  beforeEach(async () => {
    await generateImageVariants({ root })
  })

  it('reports nothing for a tree that is in sync, and generate then changes nothing', async () => {
    expect(await check()).toEqual([])

    const before = snapshot()
    await generateImageVariants({ root })
    expect(snapshot()).toEqual(before)
  })

  it('reports a source with no manifest entry as missing', async () => {
    await writeImage('post/b/new.png', 90, 'png')

    expect(await check()).toEqual([{ kind: 'missing', src: '/post/b/new.png' }])
  })

  it('reports a source whose bytes changed as stale', async () => {
    await writeImage('post/a/cover.png', 250, 'png', 200)

    expect(await check()).toEqual([{ kind: 'stale', src: '/post/a/cover.png' }])
  })

  it('reports an entry whose variant files are not all on disk as incomplete', async () => {
    fs.rmSync(path.join(root, '_img/post/a/cover-96.webp'))

    expect(await check()).toEqual([{ kind: 'incomplete', src: '/post/a/cover.png' }])
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

    expect(await check()).toEqual([
      { kind: 'config', src: '/images/photo.jpeg' },
      { kind: 'config', src: '/post/a/cover.png' },
    ])
  })

  it('reports the manifest entry and variant files left behind by a deleted source', async () => {
    fs.rmSync(path.join(root, 'post/a/cover.png'))

    expect(await check()).toEqual([
      { kind: 'orphan-entry', src: '/post/a/cover.png' },
      { kind: 'orphan-file', variant: '/_img/post/a/cover-200.avif' },
      { kind: 'orphan-file', variant: '/_img/post/a/cover-200.webp' },
      { kind: 'orphan-file', variant: '/_img/post/a/cover-250.avif' },
      { kind: 'orphan-file', variant: '/_img/post/a/cover-250.webp' },
      { kind: 'orphan-file', variant: '/_img/post/a/cover-96.avif' },
      { kind: 'orphan-file', variant: '/_img/post/a/cover-96.webp' },
    ])
  })

  it('reports a GIF whose dimensions changed as stale', async () => {
    await writeImage('post/a/anim.gif', 45, 'gif')

    expect(await check()).toEqual([{ kind: 'stale', src: '/post/a/anim.gif' }])
  })

  it('reports a source sharp cannot read, and agrees with what generate then does', async () => {
    // Regression: generate skipped it and deleted its variants, while check kept the old
    // entry and passed — so CI could pass on a tree `npm run images` would still change.
    fs.writeFileSync(path.join(root, 'post/a/cover.png'), 'not an image')

    const problems = await check()
    expect(problems).toContainEqual({ kind: 'unreadable', src: '/post/a/cover.png' })

    await generateImageVariants({ root })
    expect(await check()).toEqual([{ kind: 'unreadable', src: '/post/a/cover.png' }])
  })
})
