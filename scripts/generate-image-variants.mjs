// Generates responsive AVIF and WebP variants for every raster image under public/,
// plus a manifest the build reads to emit <picture> markup with correct intrinsic
// dimensions. Runs as `prebuild`, so `npm run build` always has fresh output.
//
// Nothing here reaches the browser — the variants are static files and the manifest is
// read at build time only. See docs/specs/post-asset-pipeline.md.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const SOURCE_ROOT = 'public';
const OUT_DIR = '_img';
const OUT_ROOT = path.join(SOURCE_ROOT, OUT_DIR);
const MANIFEST = path.join(OUT_ROOT, 'manifest.json');

const WIDTHS = [400, 800, 1200, 1600];
// The article column tops out near 720px, so 1600 covers a 2x display with headroom.
// Sources wider than this are never served at full size; sources narrower than it are
// always offered at their native width (see `targetWidths`).
const MAX_WIDTH = 1600;
// Measured at q80 the savings are still 96-98%, so quality is bought cheaply. WebP
// beats AVIF on flat UI screenshots and loses on photographs, so both are emitted and
// the browser picks. See the spec's "Why these qualities".
const FORMATS = [
  ['avif', { quality: 65 }],
  ['webp', { quality: 80 }],
];

// Cache key component: bump automatically whenever widths or encoder settings change,
// so editing the constants above regenerates rather than silently serving stale output.
const CONFIG_HASH = createHash('sha1')
  .update(JSON.stringify([WIDTHS, MAX_WIDTH, FORMATS]))
  .digest('hex')
  .slice(0, 8);

// GIFs are frequently animated and sharp would flatten them to a still; SVGs are already
// resolution independent. Both fall through to a plain <img> at render time.
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

/**
 * Widths to emit for a source of intrinsic width `native`.
 *
 * Never upscales, and always ends at the best width actually available: a 768px source
 * yields [400, 768], not [400] — otherwise the largest variant would be 400w and the
 * browser would upscale it into a 720px column. Sources wider than MAX_WIDTH stop there.
 */
export function targetWidths(native) {
  const top = Math.min(native, MAX_WIDTH);
  const widths = WIDTHS.filter((w) => w < top);
  widths.push(top);
  return widths;
}

function walk(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === OUT_ROOT) continue; // never recurse into our own output
      found.push(...walk(full));
    } else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      found.push(full);
    }
  }
  return found;
}

// Key the cache on content, not mtime — a fresh CI checkout has new mtimes on every file
// and would otherwise re-encode all 116 images on every run.
function hashFile(file) {
  return createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 12);
}

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  } catch {
    return {};
  }
}

async function main() {
  const previous = loadManifest();
  const manifest = {};
  const sources = walk(SOURCE_ROOT).sort();

  let encoded = 0;
  let reused = 0;
  let skipped = 0;

  for (const file of sources) {
    // Public URL of the original, e.g. public/post/x/y.png -> /post/x/y.png
    const src = '/' + path.relative(SOURCE_ROOT, file).split(path.sep).join('/');
    const hash = hashFile(file);

    let meta;
    try {
      meta = await sharp(file).metadata();
    } catch (error) {
      // A corrupt or unsupported file must not fail the build; it degrades to <img>.
      console.warn(`  skip ${src} — sharp could not read it (${error.message})`);
      skipped += 1;
      continue;
    }

    const cached = previous[src];
    if (cached?.hash === hash && cached.config === CONFIG_HASH && cached.variants) {
      const filesPresent = Object.values(cached.variants)
        .flat()
        .every(([, url]) => fs.existsSync(path.join(SOURCE_ROOT, url)));
      if (filesPresent) {
        manifest[src] = cached;
        reused += 1;
        continue;
      }
    }

    const targets = targetWidths(meta.width);

    const parsed = path.parse(src);
    const variants = {};

    for (const [format, options] of FORMATS) {
      variants[format] = [];
      for (const width of targets) {
        const url = `/${OUT_DIR}${parsed.dir}/${parsed.name}-${width}.${format}`;
        const out = path.join(SOURCE_ROOT, url);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        await sharp(file).resize({ width, withoutEnlargement: true })[format](options).toFile(out);
        variants[format].push([width, url]);
      }
    }

    manifest[src] = { hash, config: CONFIG_HASH, width: meta.width, height: meta.height, variants };
    encoded += 1;
  }

  fs.mkdirSync(OUT_ROOT, { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

  const bytes = (files) => files.reduce((a, f) => a + fs.statSync(f).size, 0);
  const originals = bytes(sources);
  const generated = bytes(walkOut());

  console.log(
    `images: ${encoded} encoded, ${reused} reused from cache, ${skipped} skipped, ` +
      `${sources.length} in manifest`
  );
  console.log(
    `sources ${(originals / 1024 / 1024).toFixed(1)} MB -> variants ${(generated / 1024 / 1024).toFixed(1)} MB`
  );
}

function walkOut() {
  const found = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.name !== 'manifest.json') found.push(full);
    }
  };
  if (fs.existsSync(OUT_ROOT)) visit(OUT_ROOT);
  return found;
}

// Guarded so the module can be imported by tests without encoding 111 images.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
