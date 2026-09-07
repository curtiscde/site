import fs from 'node:fs';
import path from 'node:path';

export interface ImageVariants {
  hash: string;
  width: number;
  height: number;
  variants: {
    avif: [number, string][];
    webp: [number, string][];
  };
}

export type ImageManifest = Record<string, ImageVariants>;

const MANIFEST_PATH = path.join(process.cwd(), 'public', '_img', 'manifest.json');

let cached: ImageManifest | null = null;

/**
 * Variants produced by `npm run images` (wired to `prebuild`, so a build always has them).
 *
 * Read from disk rather than imported, deliberately: a static import would bundle all 111
 * entries into whatever chunk touched it, and phase 1 exists precisely to keep build-time
 * data out of the browser. Every caller is server-side.
 *
 * A missing manifest is not an error — `npm run dev` before a first `npm run images` is a
 * normal state, and every consumer degrades to a plain <img> of the original.
 */
export function getImageManifest(): ImageManifest {
  if (cached !== null) return cached;
  try {
    cached = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as ImageManifest;
  } catch {
    cached = {};
  }
  return cached;
}

export function resetImageManifestCache(): void {
  cached = null;
}
