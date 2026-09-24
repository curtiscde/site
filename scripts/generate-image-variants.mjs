// Generates responsive AVIF and WebP variants for every raster image under public/,
// plus a manifest the build reads to emit <picture> markup with correct intrinsic
// dimensions.
//
// The output (public/_img/) is committed. Run `npm run images` after adding, changing or
// removing an image and commit the result; CI runs `npm run images:check` to enforce it.
// It still runs as `prebuild`, where a tree in sync costs nothing — so Netlify encodes
// only what someone forgot to commit, rather than every image on every build.
//
// Nothing here reaches the browser — the variants are static files and the manifest is
// read at build time only. See docs/specs/post-asset-pipeline.md and
// docs/specs/committed-image-variants.md.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const DEFAULT_ROOT = 'public';
const OUT_DIR = '_img';

// 96 and 200 exist for site chrome — the 40px avatar and the 56px CV logo tiles — where
// the smallest article rung was 10x the slot. In-article images declare a 720px `sizes`,
// so a browser never picks them there; the cost is generation time and committed bytes.
const WIDTHS = [96, 200, 400, 800, 1200, 1600];
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
// The encoder versions are part of it too: variants are committed, and a sharp or libvips
// bump that changes encoder output should fail `--check` until they are regenerated,
// rather than leave the repo holding a mix of encoder generations. Only sharp and libvips
// are keyed: they pin the prebuilt bundle, and the full `sharp.versions` list could differ
// between a macOS laptop and the Linux CI runner for reasons that do not affect output.
const CONFIG_HASH = createHash('sha1')
  .update(JSON.stringify([WIDTHS, MAX_WIDTH, FORMATS, sharp.versions.sharp, sharp.versions.vips]))
  .digest('hex')
  .slice(0, 8);

const ENCODE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
// Measured but never re-encoded: GIFs are frequently animated and sharp would flatten them
// to a still. They still get a manifest entry carrying intrinsic dimensions, so the
// renderers can set width/height on the plain <img> and avoid layout shift — these are
// among the largest files on the site. SVGs are resolution independent and are left alone.
const MEASURE_EXTENSIONS = new Set(['.gif']);
const EXTENSIONS = new Set([...ENCODE_EXTENSIONS, ...MEASURE_EXTENSIONS]);

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

function walk(dir, outRoot) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === outRoot) continue; // never recurse into our own output
      found.push(...walk(full, outRoot));
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

/**
 * Why a previous manifest entry cannot be reused for a source with content hash `hash`,
 * or null when it can. The reasons double as `--check` discrepancy kinds.
 */
function cacheMiss(cached, hash, root) {
  if (!cached?.variants) return 'missing';
  if (cached.hash !== hash) return 'stale';
  if (cached.config !== CONFIG_HASH) return 'config';
  const filesPresent = Object.values(cached.variants)
    .flat()
    .every(([, url]) => fs.existsSync(path.join(root, url)));
  if (!filesPresent) return 'incomplete';
  return null;
}

function loadManifest(manifestPath) {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Brings `<root>/_img` in line with every raster under `root`, and reports what it did.
 * `root` is the site's public/ directory; variant URLs in the manifest are relative to it.
 *
 * With `check`, nothing is encoded or written: every way the committed output disagrees
 * with the sources is collected into `discrepancies` instead. CI runs this, because
 * variants are committed and Netlify must never have to encode them.
 */
export async function generateImageVariants({ root = DEFAULT_ROOT, check = false } = {}) {
  const outRoot = path.join(root, OUT_DIR);
  const manifestPath = path.join(outRoot, 'manifest.json');
  const previous = loadManifest(manifestPath);
  const manifest = {};
  const sources = walk(root, outRoot).sort();

  let encoded = 0;
  let reused = 0;
  let measured = 0;
  let measuredBytes = 0;
  let skipped = 0;
  const discrepancies = [];

  for (const file of sources) {
    const src = toUrl(root, file);
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

    // sharp types width as optional, and a header it cannot make sense of would otherwise
    // reach targetWidths as undefined and produce `name-NaN.avif`.
    if (!meta.width || !meta.height) {
      console.warn(`  skip ${src} — sharp reported no intrinsic dimensions`);
      skipped += 1;
      continue;
    }

    // Measure-only formats carry dimensions but no `variants` key at all, which is what
    // tells the renderers to emit a plain <img> of the original. No `hash`/`config`
    // either: nothing is encoded, so there is no cached output for them to invalidate,
    // and re-reading a handful of headers each run costs nothing.
    if (!ENCODE_EXTENSIONS.has(path.extname(file).toLowerCase())) {
      const was = previous[src];
      if (check && !was) discrepancies.push({ kind: 'missing', src });
      else if (check && (was.width !== meta.width || was.height !== meta.height)) {
        discrepancies.push({ kind: 'stale', src });
      }
      manifest[src] = { width: meta.width, height: meta.height };
      measuredBytes += fs.statSync(file).size;
      measured += 1;
      continue;
    }

    const cached = previous[src];
    const miss = cacheMiss(cached, hash, root);
    if (!miss) {
      manifest[src] = cached;
      reused += 1;
      continue;
    }

    if (check) {
      discrepancies.push({ kind: miss, src });
      continue;
    }

    const targets = targetWidths(meta.width);

    const parsed = path.parse(src);
    const variants = {};

    for (const [format, options] of FORMATS) {
      variants[format] = [];
      for (const width of targets) {
        const url = `/${OUT_DIR}${parsed.dir}/${parsed.name}-${width}.${format}`;
        const out = path.join(root, url);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        await sharp(file).resize({ width, withoutEnlargement: true })[format](options).toFile(out);
        variants[format].push([width, url]);
      }
    }

    manifest[src] = { hash, config: CONFIG_HASH, width: meta.width, height: meta.height, variants };
    encoded += 1;
  }

  // Variants are committed, so anything no longer backed by a source has to be found
  // (check) or removed (generate) — otherwise deleted images live on in the repo forever.
  const live = new Set(sources.map((file) => toUrl(root, file)));
  const expected = check
    ? Object.fromEntries(Object.entries(previous).filter(([src]) => live.has(src)))
    : manifest;
  const referenced = new Set(
    Object.values(expected).flatMap((entry) =>
      Object.values(entry.variants ?? {}).flat().map(([, url]) => url)
    )
  );
  const orphanFiles = walkOut(outRoot)
    .map((file) => toUrl(root, file))
    .filter((url) => !referenced.has(url))
    .sort();

  if (check) {
    for (const src of Object.keys(previous).filter((src) => !live.has(src)).sort()) {
      discrepancies.push({ kind: 'orphan-entry', src });
    }
    for (const src of orphanFiles) discrepancies.push({ kind: 'orphan-file', src });
  } else {
    for (const url of orphanFiles) fs.rmSync(path.join(root, url));
    pruneEmptyDirs(outRoot);
    fs.mkdirSync(outRoot, { recursive: true });
    // Stable key order (sources are sorted) and a trailing newline, so an unchanged tree
    // regenerates to an identical, diff-free manifest.
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }

  const bytes = (files) => files.reduce((a, f) => a + fs.statSync(f).size, 0);
  // Measure-only sources produce no variants, so counting them in the "before" figure
  // would flatter the ratio against a "after" figure they contribute nothing to.
  const sourceBytes = bytes(sources) - measuredBytes;
  const variantBytes = bytes(walkOut(outRoot));

  return {
    encoded,
    reused,
    measured,
    skipped,
    removed: check ? 0 : orphanFiles.length,
    entries: Object.keys(manifest).length,
    sourceBytes,
    variantBytes,
    discrepancies,
  };
}

// Empty directories are not committed, so leaving them behind would only make a local
// tree differ from a fresh clone.
function pruneEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) pruneEmptyDirs(path.join(dir, entry.name));
  }
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

// Public URL of a file under root, e.g. public/post/x/y.png -> /post/x/y.png
function toUrl(root, file) {
  return '/' + path.relative(root, file).split(path.sep).join('/');
}

function walkOut(outRoot) {
  const found = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.name !== 'manifest.json') found.push(full);
    }
  };
  if (fs.existsSync(outRoot)) visit(outRoot);
  return found;
}

// Guarded so the module can be imported by tests without encoding 111 images.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes('--check');
  generateImageVariants({ check })
    .then((r) => {
      if (check) {
        if (r.discrepancies.length === 0) {
          console.log(`images: committed variants are in sync (${r.reused + r.measured} sources)`);
          return;
        }
        console.error(`images: ${r.discrepancies.length} problem(s) with committed variants:`);
        for (const { kind, src } of r.discrepancies) console.error(`  ${kind.padEnd(12)} ${src}`);
        console.error('\nRun `npm run images` and commit public/_img/ alongside the image change.');
        process.exitCode = 1;
        return;
      }
      const mb = (n) => (n / 1024 / 1024).toFixed(1);
      console.log(
        `images: ${r.encoded} encoded, ${r.reused} reused from cache, ${r.measured} measured only, ` +
          `${r.skipped} skipped, ${r.removed} orphans removed, ${r.entries} in manifest`
      );
      console.log(`sources ${mb(r.sourceBytes)} MB -> variants ${mb(r.variantBytes)} MB`);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
