import { filterPostsByTag, getPosts, getTopTags } from '../util/posts'
import { config } from '../config'

export const dynamic = 'force-static'

const generateSitemap = async () => {
  const posts = getPosts()
  const tags = getTopTags(posts)

  return `
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
  <loc>https://www.curtiscode.dev/</loc>
  <lastmod>2024-12-07T12:00:00+00:00</lastmod>
  </url>
  ${posts.map(post => {
    return `<url>
    <loc>${post.url}</loc>
    <lastmod>${post.date.toISOString()}</lastmod>
  </url>
  `}).join('')}
  ${tags.map(({ tag }) => {
      const tagPosts = filterPostsByTag(posts, tag)
      const mostRecentPost = tagPosts.sort((postA, postB) => postB.date.getTime() - postA.date.getTime())[0]
      return `
  <url>
    <loc>${config.url}/tag/${tag}</loc>
    <lastmod>${mostRecentPost.date.toISOString()}</lastmod>
  </url>`
    }).join('')}
</urlset>`
}

export async function GET() {
  return new Response(
    await generateSitemap(),
    {
      headers: {
        'content-type': 'application/xml'
      }
    }
  )
}