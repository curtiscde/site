export const VARIANT_ROOT = '/_img';

export type VariantFormat = 'avif' | 'webp';

/**
 * URL of one generated variant, derived from the original's public path.
 *
 * This mirrors the naming in scripts/generate-image-variants.mjs. Deriving rather than
 * carrying every URL keeps the payload small where a client component needs variants
 * (PostCard renders inside `'use client'` and cannot read the manifest from disk), so
 * only the list of widths has to travel with the post.
 *
 * urls.test.ts checks every entry in the real manifest against this function, so the two
 * cannot drift apart silently.
 */
export function variantUrl(src: string, width: number, format: VariantFormat): string {
  const lastSlash = src.lastIndexOf('/');
  const dir = src.slice(0, lastSlash);
  const file = src.slice(lastSlash + 1);
  const dot = file.lastIndexOf('.');
  const name = dot === -1 ? file : file.slice(0, dot);
  return `${VARIANT_ROOT}${dir}/${name}-${width}.${format}`;
}

export function variantSrcSet(src: string, widths: number[], format: VariantFormat): string {
  return widths.map((width) => `${variantUrl(src, width, format)} ${width}w`).join(', ');
}
