import { z } from "zod"
import { marked } from 'marked';
import hljs from 'highlight.js';
import { getImageManifest, renderPicture } from '../util/images';
import { config } from "../config";

export function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

marked.setOptions({ gfm: true });

// Posts were authored across a decade of tooling, so fences carry Prism-era language
// names alongside highlight.js ones. Normalise before looking the language up.
const LANGUAGE_ALIASES: Record<string, string> = {
  clike: 'c',
  markup: 'xml',
  md: 'markdown',
  zsh: 'bash',
};

// Highlighting happens here, at build time, rather than in the browser. This module is
// reachable from server code only — every client import of `Post` is `import type`, so
// neither marked nor highlight.js is bundled. See docs/specs/post-asset-pipeline.md.
marked.use({
  renderer: {
    code({ text, lang }) {
      // marked hands back the whole info string; take the first token so a future
      // ```js title="x" still resolves to `js`.
      const name = lang?.trim().split(/\s+/)[0] ?? '';
      const language = LANGUAGE_ALIASES[name] ?? name;
      const isKnown = language !== '' && hljs.getLanguage(language) != null;
      const highlighted = isKnown
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value;
      // The `hljs` class must sit on <code> — that is what the atom-one-dark
      // stylesheet targets for token colours.
      const className = isKnown ? `hljs language-${language}` : 'hljs';
      return `<pre><code class="${className}">${highlighted}</code></pre>`;
    },
    // In-article images become responsive <picture> markup against the build-time
    // manifest. The markdown alt text doubles as a visible caption.
    image({ href, text }) {
      return renderPicture({ src: href, alt: text ?? '' });
    },
  },
});

export const rawPostSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  slug: z.string(),
  tags: z.string().array(),
  date: z.date(),
  content: z.string(),
  author: z.string().optional(),
})

export type RawPost = z.infer<typeof rawPostSchema>

/**
 * Variant data for a post's cover image, resolved at build time.
 *
 * PostCard renders inside `'use client'` components, so it cannot read the manifest from
 * disk the way the in-article renderer does. Only the widths travel with the post — the
 * URLs are derived from them by `variantUrl`, which keeps the serialised props small.
 */
export interface CoverImage {
  width: number;
  height: number;
  /** Empty for a measured-but-not-encoded source (a GIF cover); the dimensions still apply. */
  widths: number[];
}

function resolveCoverImage(src: string | undefined): CoverImage | undefined {
  if (src === undefined) return undefined;
  const entry = getImageManifest()[src];
  if (entry === undefined) return undefined;
  return {
    width: entry.width,
    height: entry.height,
    widths: entry.variants?.webp.map(([w]) => w) ?? [],
  };
}

export function transformPost(post: RawPost) {
  const { date, image: imageThumbnailUrl, slug, ...rest } = post
  const imageThumbnail = resolveCoverImage(imageThumbnailUrl)

  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  const dateFormatted = `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  const contentHtml = marked.parse(post.content, { async: false });

  const path = `/post/${slug}`
  const url = `${config.url}${path}`

  return {
    ...rest,
    date,
    dateFormatted,
    contentHtml,
    imageThumbnailUrl,
    // Absent rather than undefined when there is no cover or no variants, so the field
    // is optional on Post and existing fixtures stay valid.
    ...(imageThumbnail !== undefined && { imageThumbnail }),
    slug,
    path,
    url
  }
}

export const postSchema = rawPostSchema.transform(transformPost)

export type Post = z.infer<typeof postSchema>

/**
 * A post without its body — everything a listing card needs and nothing it does not.
 *
 * Listing pages render summary cards, never an article. But `PostCard` sits inside
 * `'use client'` components (`Posts`, `MasonryPosts`), so whatever is handed to them is
 * serialised into the RSC payload of every page that renders one. Passing a whole `Post`
 * shipped both `content` (the raw markdown) and `contentHtml` (the rendered article) to
 * pages that display neither — 11.4 MB across the 150 listing pages.
 *
 * Note that typing alone does not fix this: `Post` is structurally assignable to
 * `PostSummary`, so the extra fields would still cross the boundary and still serialise.
 * The payload only shrinks because `toSummary` actually removes them. The build assertion
 * in scripts/check-client-bundle.mjs is what stops that regressing.
 */
export type PostSummary = Omit<Post, 'content' | 'contentHtml'>

/**
 * A post as an article page needs it: the rendered body, but not the markdown it came
 * from. `PostPage` is a client component and reads `contentHtml` only, so shipping
 * `content` alongside it sent every article to the browser twice.
 */
export type PostArticle = Omit<Post, 'content'>

/** Strips the body off a post. See PostSummary for why this must be called, not just typed. */
export function toSummary(post: Post): PostSummary {
  // Destructured out rather than picked, so a new field added to Post reaches listings
  // automatically and only the two body fields are ever dropped.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content, contentHtml, ...summary } = post
  return summary
}

/** Drops the markdown source, keeping the rendered body an article page actually renders. */
export function toArticle(post: Post): PostArticle {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content, ...article } = post
  return article
}
