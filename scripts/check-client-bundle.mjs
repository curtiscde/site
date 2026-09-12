#!/usr/bin/env node
/**
 * Guards the client boundary.
 *
 * `marked` and `highlight.js` are build-time concerns: articles are rendered and
 * highlighted during `next build`, so neither has any reason to be in a browser
 * bundle. highlight.js was — a 978 KB chunk on every page, because PostPage
 * highlighted in a useEffect. marked never was, but it is one value import away
 * from being: `types/Post.ts` calls `marked.setOptions()` at module scope, and it
 * is only kept out of the client graph by every client import of `Post` being
 * `import type`. Both conditions are silent when broken, so assert them.
 *
 * On patterns: do NOT match the bare substring "marked". highlight.js grammars
 * contain the identifier `mip_markedonly`, so a substring test reports marked as
 * bundled whenever highlight.js is — which is exactly the false positive that
 * sent the original audit down the wrong path. Match string literals and public
 * API property names instead; minifiers rewrite locals but leave those alone.
 *
 * See docs/specs/post-asset-pipeline.md.
 */
import { gzipSync } from 'node:zlib';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CHUNK_DIR = join(process.cwd(), '.next', 'static', 'chunks');

// Phase 3 adds client JavaScript to a site whose headline problem was client JavaScript,
// so the spec makes its cost a success criterion rather than an aspiration. Measured on
// the 9-image article, which loads every chunk a post page can pull.
const BUDGET_PAGE = join(process.cwd(), 'out', 'post', '8-useful-atom-packages.html');
const BUDGET_KB = 190; // phase 2 baseline was 187.7 KB gzipped across 9 chunks

const FORBIDDEN = [
  { name: 'highlight.js', patterns: [/\bhljs\b/, /Could not find the language/] },
  { name: 'marked', patterns: [/marked\(\): input/, /\bwalkTokens\b/] },
];

function jsFilesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return jsFilesIn(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

let files;
try {
  files = jsFilesIn(CHUNK_DIR);
} catch {
  console.error(`✗ No client chunks at ${CHUNK_DIR} — run \`npm run build\` first.`);
  process.exit(1);
}

const failures = [];
for (const file of files) {
  const source = readFileSync(file, 'utf-8');
  for (const { name, patterns } of FORBIDDEN) {
    const hit = patterns.find((pattern) => pattern.test(source));
    if (hit !== undefined) failures.push({ name, file, hit });
  }
}

if (failures.length > 0) {
  console.error(`✗ Build-time-only libraries found in ${failures.length} client chunk(s):\n`);
  for (const { name, file, hit } of failures) {
    console.error(`    ${name} → ${file.replace(process.cwd() + '/', '')}  (matched ${hit})`);
  }
  console.error(`
  Something reachable from a 'use client' component is importing types/Post.ts as a
  value. Find it and make the import \`import type { Post } from ...\`.
`);
  process.exit(1);
}

console.log(`✓ ${files.length} client chunks checked — no marked, no highlight.js.`);

// Listing pages render summary cards and no article body, but PostCard sits inside
// 'use client' components, so anything handed to it is serialised into the page's RSC
// payload. Passing a whole Post shipped both the markdown and the rendered article to
// pages that display neither — 11.4 MB across 150 pages. `toSummary` strips them.
//
// Typing alone cannot hold this: Post is structurally assignable to PostSummary, so a
// forgotten `.map(toSummary)` type-checks and silently restores the payload. This is the
// assertion that actually catches it.
const OUT_DIR = join(process.cwd(), 'out');

/** Every generated page except the article pages, which legitimately carry one body. */
function listingPagesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return full === join(OUT_DIR, 'post') ? [] : listingPagesIn(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

// Scanned in full rather than sampled: there are ~150 tag listings, and checking three
// named files would let a regression on any of the others through silently. The whole
// scan takes about a second.
if (existsSync(OUT_DIR)) {
  const pages = listingPagesIn(OUT_DIR);
  if (pages.length === 0) {
    console.error(`✗ No listing pages under ${OUT_DIR} — the export looks incomplete.`);
    process.exit(1);
  }

  const bodyLeaks = [];
  for (const page of pages) {
    const html = readFileSync(page, 'utf-8');
    // Markers that only ever come from a rendered article body.
    const found = [
      ['contentHtml', html.includes('contentHtml')],
      ['highlighted code', html.includes('hljs-')],
      ['article figures', html.includes('\\u003cfigure\\u003e') || html.includes('<figure>')],
    ].filter(([, hit]) => hit).map(([name]) => name);
    if (found.length > 0) bodyLeaks.push({ page, found });
  }

  if (bodyLeaks.length > 0) {
    console.error(`✗ Article bodies found in ${bodyLeaks.length} of ${pages.length} listing page(s):\n`);
    for (const { page, found } of bodyLeaks.slice(0, 10)) {
      console.error(`    ${page.replace(process.cwd() + '/', '')}  (${found.join(', ')})`);
    }
    if (bodyLeaks.length > 10) console.error(`    ... and ${bodyLeaks.length - 10} more`);
    console.error(`
  A listing page is passing whole Post objects into a client component. Map them through
  \`toSummary\` — note that the types alone will not complain, because Post is
  structurally assignable to PostSummary.
`);
    process.exit(1);
  }
  console.log(`✓ ${pages.length} listing pages carry no article bodies.`);
}

// Budget check runs against `out/`, which only exists after a full export. Skipped rather
// than failed when absent, so `check:bundle` still works against a plain `next build`.
if (existsSync(BUDGET_PAGE)) {
  const html = readFileSync(BUDGET_PAGE, 'utf-8');
  const referenced = [...new Set(html.match(/\/_next\/static\/chunks\/[A-Za-z0-9_\-./]+\.js/g) ?? [])];
  const gzipped = referenced.reduce((total, url) => {
    const file = join(process.cwd(), 'out', url);
    return existsSync(file) ? total + gzipSync(readFileSync(file), { level: 9 }).length : total;
  }, 0);
  const kb = gzipped / 1024;

  if (kb > BUDGET_KB) {
    console.error(
      `✗ Post-page JavaScript is ${kb.toFixed(1)} KB gzipped across ${referenced.length} chunks, ` +
        `over the ${BUDGET_KB} KB budget.\n\n  The lightbox is allowed 2 KB on top of the phase 2 ` +
        `baseline of 187.7 KB. Something larger than that has been added to a client component.\n`
    );
    process.exit(1);
  }
  console.log(`✓ post-page JS ${kb.toFixed(1)} KB gzipped (${referenced.length} chunks, budget ${BUDGET_KB} KB).`);
}
