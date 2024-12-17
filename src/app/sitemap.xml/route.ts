import type { MetadataRoute } from 'next'
import { getPosts } from '../util/posts'
import { config } from '../config'

export const dynamic = 'force-static'

const generateSitemap = async () => {
  const posts = getPosts()

  return `
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<url>
<loc>https://www.curtiscode.dev/</loc>
<lastmod>2024-12-07T12:00:00+00:00</lastmod>
</url>
${posts.map(post => {
    return `
  <url>
<loc>${config.url}/post/${post.slug}</loc>
<lastmod>${post.date}</lastmod>
</url>

  `
  })}
</urlset>`
}

export async function GET(req: Request) {
  return new Response(
    await generateSitemap(),
    {
      headers: {
        'content-type': 'application/xml'
      }
    }
  )
}