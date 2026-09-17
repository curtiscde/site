import type { PostSummary } from '../../types'
import { config } from '../../config'

/**
 * schema.org `BlogPosting` for an article, as a JSON string ready for a
 * `<script type="application/ld+json">`.
 *
 * This used to be built in `PostPage` and appended to `document.head` from a `useEffect`,
 * which meant it existed in **zero bytes of served HTML** — dead code on every article
 * page. Building it here puts it in the document the server sends.
 *
 * Worth being accurate about what that buys: JSON-LD is read by search engines'
 * structured-data parsers and nothing else. Link previews use OpenGraph, which was always
 * server-rendered, so unfurls were never affected. Structured data is not a ranking
 * factor either. The reason to do it is correctness.
 *
 * `articleBody` is deliberately not emitted. It carried `post.contentHtml` — the rendered
 * article, markup and all — which is not what the property means (it expects text) and
 * added 16-25 KB to every article page, 15-23% of their weight, for a property Google
 * does not use for Article results. Taking `PostSummary` rather than `Post` is what makes
 * that structural: the body is not in scope, so it cannot creep back in.
 */
export function buildBlogPosting(post: PostSummary): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description || post.title,
    author: {
      '@type': 'Person',
      name: post.author || config.title,
    },
    datePublished: post.date.toISOString(),
    dateModified: post.date.toISOString(),
    image: post.imageThumbnailUrl ? `${config.url}${post.imageThumbnailUrl}` : undefined,
    keywords: post.tags.join(', '),
    mainEntityOfPage: { '@type': 'WebPage', '@id': post.url },
  })
}

/**
 * Escapes a JSON-LD payload for embedding in a `<script>` element.
 *
 * `JSON.stringify` escapes quotes but not `<`, so a post title containing `</script>`
 * would close the element and everything after it would parse as markup. Escaping the
 * three characters that can start a tag-like sequence keeps the JSON byte-identical to a
 * parser while making a breakout impossible.
 *
 * The values here are author-written rather than reader-supplied, so this is defence in
 * depth rather than a live hole — but it costs nothing and the failure mode is script
 * injection on every article page.
 */
export function escapeJsonLd(json: string): string {
  return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}
