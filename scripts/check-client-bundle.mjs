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
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CHUNK_DIR = join(process.cwd(), '.next', 'static', 'chunks');

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
