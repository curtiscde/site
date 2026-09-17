import { z } from "zod"
import { marked, type Token } from 'marked';
import hljs from 'highlight.js';
import { renderPicture, resolveImage, type ImageVariantSet } from '../util/images';
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

/**
 * Is this paragraph nothing but an image?
 *
 * Covers a bare `![alt](src)`, the reference form `![alt][1]`, and an image wrapped in a
 * link — `2017-moving-wordpress-hugo` links its xkcd image out, and an <a> is transparent
 * content, so a <figure> inside it is just as invalid inside a <p>.
 *
 * A paragraph mixing text and an image stays wrapped: unwrapping it would move the text
 * out of any paragraph at all. No post does that today, but the check is cheap.
 */
function isLoneImage(tokens: Token[]): boolean {
  if (tokens.length !== 1) return false;
  const [token] = tokens;
  if (token.type === 'image') return true;
  return token.type === 'link' && isLoneImage(token.tokens ?? []);
}

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
    // `image` is an inline renderer, so its <figure> landed wherever the image sat —
    // and a markdown image alone on a line is still a paragraph containing an image.
    // That produced `<p><figure>...</figure></p>` on 77 of the site's 78 images.
    // <figure> is flow content and cannot live in a <p>, so browsers closed the
    // paragraph early and left a stray empty <p> either side of every image.
    //
    // Unwrapping here rather than post-processing the HTML keeps it in the one place
    // that knows the paragraph only ever held the image.
    paragraph({ tokens }) {
      const inner = this.parser.parseInline(tokens);
      return isLoneImage(tokens) ? inner : `<p>${inner}</p>`;
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

/** @see ImageVariantSet — the same shape, named for its use on a post. */
export type CoverImage = ImageVariantSet

export function transformPost(post: RawPost) {
  // `content` is destructured out, not spread: it is the markdown source, consumed below
  // to produce `contentHtml` and read by nothing afterwards. Leaving it on `Post` sent
  // every article to the browser twice — once as markdown, once as rendered HTML — on
  // every page that carried a post.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { date, image: imageThumbnailUrl, slug, content, ...rest } = post
  const imageThumbnail = resolveImage(imageThumbnailUrl)

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
 * shipped the rendered article to pages that display none — 11.4 MB across the 150
 * listing pages, before the markdown was dropped in `transformPost` as well.
 *
 * Note that typing alone does not fix this: `Post` is structurally assignable to
 * `PostSummary`, so `contentHtml` would still cross the boundary and still serialise.
 * The payload only shrinks because `toSummary` actually removes it. The build assertion
 * in scripts/check-client-bundle.mjs is what stops that regressing.
 */
export type PostSummary = Omit<Post, 'contentHtml'>

/** Strips the body off a post. See PostSummary for why this must be called, not just typed. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function toSummary({ contentHtml, ...summary }: Post): PostSummary {
  // Picked by exclusion rather than by listing the fields a card needs, so a rename in
  // `Post` cannot silently empty a card. The trade is that this is fail-open for payload
  // size: a large field added to `Post` reaches all 150 listing pages without anyone
  // deciding to send it, and the build assertion only looks for article-body markers.
  // Worth revisiting if `Post` ever grows another heavy field.
  return summary
}
