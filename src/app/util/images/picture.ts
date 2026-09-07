import { getImageManifest, type ImageManifest } from './manifest';
import { variantSrcSet } from './urls';

// The article column is `prose lg:prose-lg` (~720px at its widest). Below the md
// breakpoint the image spans the viewport less the `mx-6` gutters.
export const ARTICLE_SIZES = '(max-width: 768px) 100vw, 720px';

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface PictureOptions {
  src: string;
  alt: string;
  sizes?: string;
  manifest?: ImageManifest;
}

/**
 * Builds the <figure><picture> markup for an in-article image, as a string, because
 * in-article images come from a `marked` renderer rather than React.
 *
 * `PostImage.tsx` produces the same shape as JSX. The two are kept in step by
 * picture.test.ts and PostImage.test.tsx asserting the same structure.
 */
export function renderPicture({ src, alt, sizes = ARTICLE_SIZES, manifest }: PictureOptions): string {
  const entry = (manifest ?? getImageManifest())[src];
  const safeAlt = escapeAttribute(alt);
  const safeSrc = escapeAttribute(src);

  // GIFs, SVGs and anything sharp could not read have no entry. Degrade to a plain
  // <img> of the original rather than emitting a broken <source>.
  if (entry === undefined) {
    const caption = alt === '' ? '' : `<figcaption aria-hidden="true">${safeAlt}</figcaption>`;
    return (
      `<figure><img src="${safeSrc}" alt="${safeAlt}" loading="lazy" decoding="async">` +
      `${caption}</figure>`
    );
  }

  const { width, height, variants } = entry;
  const widths = variants.webp.map(([w]) => w);
  // Widest variant as the <img> fallback: it is only fetched by browsers that support
  // neither AVIF nor WebP, which in practice means none.
  const fallback = variants.webp[variants.webp.length - 1]?.[1] ?? src;

  // `data-full` is the untouched original, which phase 3's lightbox opens on click. It
  // costs nothing until then.
  const caption = alt === '' ? '' : `<figcaption aria-hidden="true">${safeAlt}</figcaption>`;

  return (
    '<figure>' +
    '<picture>' +
    `<source type="image/avif" srcset="${variantSrcSet(src, widths, 'avif')}" sizes="${sizes}">` +
    `<source type="image/webp" srcset="${variantSrcSet(src, widths, 'webp')}" sizes="${sizes}">` +
    `<img src="${escapeAttribute(fallback)}" alt="${safeAlt}" width="${width}" height="${height}"` +
    ` data-full="${safeSrc}" loading="lazy" decoding="async">` +
    '</picture>' +
    caption +
    '</figure>'
  );
}
