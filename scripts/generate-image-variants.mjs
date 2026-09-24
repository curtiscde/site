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

/** Every way the committed output can disagree with the sources, as `--check` reports it. */
export const PROBLEM = Object.freeze({
  MISSING: 'missing', // source with no manifest entry
  STALE: 'stale', // source changed since its entry was written
  CONFIG: 'config', // entry written under different widths, qualities or encoder
  INCOMPLETE: 'incomplete', // entry names variant files that are not on disk
  UNREADABLE: 'unreadable', // sharp cannot read the source at all
  ORPHAN_ENTRY: 'orphan-entry', // entry whose source no longer exists
  ORPHAN_FILE: 'orphan-file', // file under _img/ that no entry accounts for
});

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

/**
 * Checks whether the committed output under `<root>/_img` matches every raster under
 * `root`. Reads only; never encodes or writes. An empty `problems` list means
 * `generateImageVariants` would change nothing.
 */
export async function checkImageVariants({ root = DEFAULT_ROOT } = {}) {
  const plan = await planImageVariants(root);
  return { problems: plan.problems, sources: plan.sources.length };
}

/**
 * Brings `<root>/_img` in line with every raster under `root`: encodes what is missing or
 * out of date, removes what nothing accounts for, and rewrites the manifest. `root` is the
 * site's public/ directory; variant URLs in the manifest are relative to it.
 */
export async function generateImageVariants({ root = DEFAULT_ROOT } = {}) {
  const plan = await planImageVariants(root);
  const paths = layout(root);
  const manifest = {};
  const counts = { encoded: 0, reused: 0, measured: 0, skipped: 0 };

  for (const source of plan.sources) {
    switch (source.action) {
      case 'reuse':
        manifest[source.src] = source.entry;
        counts.reused += 1;
        break;
      case 'measure':
        manifest[source.src] = source.entry;
        counts.measured += 1;
        break;
      case 'skip':
        // A corrupt or unsupported file must not fail the build; it degrades to <img>.
        console.warn(`  skip ${source.src} — ${source.reason}`);
        counts.skipped += 1;
        break;
      case 'encode': {
        const variants = plannedVariants(source.src, source.width);
        for (const [format, options] of FORMATS) {
          for (const [width, url] of variants[format]) {
            const out = path.join(root, url);
            fs.mkdirSync(path.dirname(out), { recursive: true });
            await sharp(source.file).resize({ width, withoutEnlargement: true })[format](options).toFile(out);
          }
        }
        manifest[source.src] = {
          hash: source.hash,
          config: CONFIG_HASH,
          width: source.width,
          height: source.height,
          variants,
        };
        counts.encoded += 1;
        break;
      }
    }
  }

  // Variants are committed, so anything no longer accounted for is removed here —
  // otherwise deleted or renamed images would live on in the repo forever.
  for (const url of plan.orphanFiles) fs.rmSync(path.join(root, url));
  pruneEmptyDirs(paths.outDir);
  fs.mkdirSync(paths.outDir, { recursive: true });
  // Stable key order (sources are sorted) and a trailing newline, so an unchanged tree
  // regenerates to an identical, diff-free manifest — and is then not written at all, so
  // an in-sync run touches nothing on disk.
  const json = JSON.stringify(manifest, null, 2) + '\n';
  if (readText(paths.manifest) !== json) fs.writeFileSync(paths.manifest, json);

  const bytes = (files) => files.reduce((total, file) => total + fs.statSync(file).size, 0);
  const encodable = plan.sources.filter((s) => s.action === 'reuse' || s.action === 'encode');
  return {
    ...counts,
    removed: plan.orphanFiles.length,
    entries: Object.keys(manifest).length,
    // Measure-only sources produce no variants, so counting them in the "before" figure
    // would flatter the ratio against an "after" figure they contribute nothing to.
    sourceBytes: bytes(encodable.map((s) => s.file)),
    variantBytes: bytes(outputFiles(paths)),
  };
}

/**
 * The single source of truth for both operations: what should happen to each source, and
 * every problem with the committed output. Check reports `problems`; generate carries out
 * the actions. Because both read this, check passing means generate is a no-op.
 */
async function planImageVariants(root) {
  const paths = layout(root);
  const committed = loadManifest(paths.manifest);
  const problems = [];
  const sources = [];

  for (const file of sourceFiles(paths)) {
    const src = toUrl(root, file);
    const committedEntry = committed[src];

    const dimensions = await readDimensions(file);
    if (dimensions.reason) {
      problems.push({ kind: PROBLEM.UNREADABLE, src });
      sources.push({ src, file, action: 'skip', reason: dimensions.reason });
      continue;
    }
    const { width, height } = dimensions;

    if (!ENCODE_EXTENSIONS.has(path.extname(file).toLowerCase())) {
      // Measure-only entries carry dimensions and no `variants` key at all, which is what
      // tells the renderers to emit a plain <img> of the original. No `hash`/`config`
      // either: nothing is encoded, so there is nothing cached for them to invalidate.
      const problem = !committedEntry
        ? PROBLEM.MISSING
        : committedEntry.width !== width || committedEntry.height !== height
          ? PROBLEM.STALE
          : null;
      if (problem) problems.push({ kind: problem, src });
      sources.push({ src, file, action: 'measure', entry: { width, height } });
      continue;
    }

    const hash = hashFile(file);
    const problem = reuseProblem(committedEntry, hash, root);
    if (problem) {
      problems.push({ kind: problem, src });
      sources.push({ src, file, action: 'encode', hash, width, height });
    } else {
      sources.push({ src, file, action: 'reuse', entry: committedEntry });
    }
  }

  const sourceUrls = new Set(sources.map((s) => s.src));
  for (const src of Object.keys(committed).filter((src) => !sourceUrls.has(src)).sort()) {
    problems.push({ kind: PROBLEM.ORPHAN_ENTRY, src });
  }

  const accountedFor = new Set(
    sources.flatMap((s) => {
      if (s.action === 'reuse') return variantUrls(s.entry.variants);
      if (s.action === 'encode') return variantUrls(plannedVariants(s.src, s.width));
      return [];
    })
  );
  const orphanFiles = outputFiles(paths)
    .map((file) => toUrl(root, file))
    .filter((url) => !accountedFor.has(url))
    .sort();
  for (const variant of orphanFiles) problems.push({ kind: PROBLEM.ORPHAN_FILE, variant });

  return { problems, sources, orphanFiles };
}

/**
 * Why a committed manifest entry cannot be reused for a source with content hash `hash`,
 * or null when it can.
 */
function reuseProblem(entry, hash, root) {
  if (!entry?.variants) return PROBLEM.MISSING;
  if (entry.hash !== hash) return PROBLEM.STALE;
  if (entry.config !== CONFIG_HASH) return PROBLEM.CONFIG;
  const allOnDisk = variantUrls(entry.variants).every((url) => fs.existsSync(path.join(root, url)));
  if (!allOnDisk) return PROBLEM.INCOMPLETE;
  return null;
}

/** The variant set a source of width `width` gets: `{ avif: [[width, url], ...], webp: ... }`. */
function plannedVariants(src, width) {
  const parsed = path.posix.parse(src);
  return Object.fromEntries(
    FORMATS.map(([format]) => [
      format,
      targetWidths(width).map((w) => [w, `/${OUT_DIR}${parsed.dir}/${parsed.name}-${w}.${format}`]),
    ])
  );
}

function variantUrls(variants = {}) {
  return Object.values(variants)
    .flat()
    .map(([, url]) => url);
}

async function readDimensions(file) {
  let meta;
  try {
    meta = await sharp(file).metadata();
  } catch (error) {
    return { reason: `sharp could not read it (${error.message})` };
  }
  // sharp types width as optional, and a header it cannot make sense of would otherwise
  // reach targetWidths as undefined and produce `name-NaN.avif`.
  if (!meta.width || !meta.height) return { reason: 'sharp reported no intrinsic dimensions' };
  return { width: meta.width, height: meta.height };
}

function layout(root) {
  const outDir = path.join(root, OUT_DIR);
  return { root, outDir, manifest: path.join(outDir, 'manifest.json') };
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name));
}

function sourceFiles({ root, outDir }) {
  return listFiles(root)
    .filter((file) => !file.startsWith(outDir + path.sep)) // never read our own output
    .filter((file) => EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort();
}

function outputFiles({ outDir, manifest }) {
  return listFiles(outDir).filter((file) => file !== manifest);
}

// Key the cache on content, not mtime — a fresh CI checkout has new mtimes on every file
// and would otherwise re-encode every image on every run.
function hashFile(file) {
  return createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 12);
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function loadManifest(manifestPath) {
  try {
    return JSON.parse(readText(manifestPath) ?? '{}');
  } catch {
    return {};
  }
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

async function runCheck() {
  const { problems, sources } = await checkImageVariants();
  if (problems.length === 0) {
    console.log(`images: committed variants are in sync (${sources} sources)`);
    return;
  }
  console.error(`images: ${problems.length} problem(s) with committed variants:`);
  for (const problem of problems) {
    console.error(`  ${problem.kind.padEnd(12)} ${problem.src ?? problem.variant}`);
  }
  console.error('\nRun `npm run images` and commit public/_img/ alongside the image change.');
  process.exitCode = 1;
}

async function runGenerate() {
  const result = await generateImageVariants();
  const mb = (n) => (n / 1024 / 1024).toFixed(1);
  console.log(
    `images: ${result.encoded} encoded, ${result.reused} reused from cache, ` +
      `${result.measured} measured only, ${result.skipped} skipped, ` +
      `${result.removed} orphans removed, ${result.entries} in manifest`
  );
  console.log(`sources ${mb(result.sourceBytes)} MB -> variants ${mb(result.variantBytes)} MB`);
}

// Guarded so the module can be imported by tests without encoding every image.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = process.argv.includes('--check') ? runCheck : runGenerate;
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
