import { getImageManifest } from './manifest';

/**
 * What a React `<picture>` needs about one image, resolved at build time.
 *
 * Only the widths travel, not the URLs: `variantUrl` derives those, which keeps the
 * payload small where a client component needs them (`PostCard` and `Footer` both render
 * inside `'use client'` and cannot read the manifest from disk).
 */
export interface ImageVariantSet {
  width: number;
  height: number;
  /** Empty for a measured-but-not-encoded source (a GIF); the dimensions still apply. */
  widths: number[];
}

/**
 * Looks `src` up in the build-time manifest.
 *
 * Server-only — it reads the manifest from disk. Returns `undefined` for anything the
 * generator never processed (SVGs, remote URLs, files sharp could not read), which is the
 * signal `PostImage` uses to fall back to a plain `<img>` of the original.
 */
export function resolveImage(src: string | undefined): ImageVariantSet | undefined {
  if (src === undefined) return undefined;
  const entry = getImageManifest()[src];
  if (entry === undefined) return undefined;
  return {
    width: entry.width,
    height: entry.height,
    widths: entry.variants?.webp.map(([w]) => w) ?? [],
  };
}
