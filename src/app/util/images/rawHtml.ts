import { getImageManifest, type ImageManifest } from './manifest';
import { ARTICLE_SIZES, escapeAttribute, pictureSources } from './picture';

/**
 * Upgrades `<img>` tags written as raw HTML inside a post's markdown.
 *
 * `marked` only calls its `image` renderer for `![alt](src)` syntax. The WordPress-era
 * posts imported in 2015 reference their screenshots as literal HTML instead, so those
 * images went straight through `marked` untouched and were served as untouched originals
 * — the whole AVIF/WebP pipeline bypassed, on three articles.
 *
 * The alternative was rewriting the markdown, but `posts/**` is the source of truth for
 * the site and this way any raw HTML added in future is covered too.
 *
 * Two deliberate differences from `renderPicture`:
 *
 * - No `<figure>`/`<figcaption>` wrapper. Four of the seven sit inline inside a paragraph
 *   (`<strong>BAD:</strong>\n<img ...>` is one `<p>`), where a `<figure>` would close the
 *   paragraph early and change the rendered document. `<picture>` is phrasing content and
 *   is valid in both positions. The WordPress `alt` values are filename slugs
 *   ("js-bad", "HelpersSolutionExplorer") in any case, so promoting them to visible
 *   captions the way markdown alt text is promoted would be a regression, not a feature.
 * - Every attribute the author wrote is preserved, `class` and hand-written dimensions
 *   included. Only `src` is rewritten; `data-full`, `loading`, `decoding` and — where the
 *   author gave none — `width`/`height` are added.
 */
export interface RawImageOptions {
  sizes?: string;
  manifest?: ImageManifest;
}

const IMG_TAG = /<img\b[^>]*>/gi;
const SRC_ATTRIBUTE = /(^|\s)src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i;

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
};

/**
 * An attribute value in the markdown is HTML-escaped; a manifest key is a plain path. A
 * filename containing `&` would otherwise be looked up as `a&amp;b.png` and silently miss.
 */
function decodeEntities(value: string): string {
  return value.replace(/&(?:amp|quot|apos|#39|lt|gt);/g, (entity) => ENTITIES[entity] ?? entity);
}

function hasAttribute(attributes: string, name: string): boolean {
  return new RegExp(`(?:^|\\s)${name}(?=[\\s=>]|$)`, 'i').test(attributes);
}

function upgradeTag(tag: string, manifest: ImageManifest, sizes: string): string {
  // Everything between `<img` and the closing `>`, self-closing slash dropped. Trailing
  // space goes too, so the attributes this function appends are separated by exactly one.
  const attributes = tag.replace(/^<img/i, '').replace(/\/?>$/, '').replace(/\s+$/, '');

  const match = SRC_ATTRIBUTE.exec(attributes);
  if (match === null) return tag;
  const src = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');

  // No manifest entry: a remote URL, an SVG, or a path the generator could not read.
  // Leave it exactly as the author wrote it.
  const entry = manifest[src];
  if (entry === undefined) return tag;

  // Only supplied when the author gave neither, so a hand-written pair is never silently
  // contradicted by the manifest's.
  const dimensions =
    hasAttribute(attributes, 'width') || hasAttribute(attributes, 'height')
      ? ''
      : ` width="${entry.width}" height="${entry.height}"`;
  const loading = hasAttribute(attributes, 'loading') ? '' : ' loading="lazy"';
  const decoding = hasAttribute(attributes, 'decoding') ? '' : ' decoding="async"';
  const added = `${dimensions}${loading}${decoding}`;

  // Measured but not re-encoded — a GIF. Serving the original is correct here; the
  // dimensions still stop it shifting the layout as it loads.
  if (entry.variants === undefined) return `<img${attributes}${added}>`;

  const widths = entry.variants.webp.map(([width]) => width);
  // Widest variant as the <img> fallback, matching renderPicture: it is only fetched by
  // browsers supporting neither AVIF nor WebP.
  const fallback = entry.variants.webp[entry.variants.webp.length - 1]?.[1] ?? src;

  // Function replacer, not a `$1` template: a replacement string would treat any `$` in a
  // URL as a capture group reference.
  const swapped = attributes.replace(
    SRC_ATTRIBUTE,
    (_full, lead: string) =>
      `${lead}src="${escapeAttribute(fallback)}" data-full="${escapeAttribute(src)}"`
  );

  return `<picture>${pictureSources(src, widths, sizes)}<img${swapped}${added}></picture>`;
}

export function upgradeRawImages(
  html: string,
  { sizes = ARTICLE_SIZES, manifest }: RawImageOptions = {}
): string {
  // Most raw HTML in the posts is `<strong>`, `<h3>` and `<a>`; skip the manifest read
  // and the scan entirely for those.
  if (!/<img\b/i.test(html)) return html;

  const entries = manifest ?? getImageManifest();
  return html.replace(IMG_TAG, (tag) => upgradeTag(tag, entries, sizes));
}
