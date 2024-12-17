import { getPosts } from '../util/posts'
import { config } from '../config'

export const dynamic = 'force-static'

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const generateRssFeed = async () => {
  const posts = getPosts().slice(0, 50)
  const latestPost = posts[0]

  return `
  <rss xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
    <channel>
      <title>${config.title}</title>
      <link>${config.url}</link>
      <description>${config.rssFeedDescription}</description>
      <language>en-GB</language>
      <lastBuildDate>${latestPost.date.toISOString()}</lastBuildDate>
      <atom:link href="${config.url}/rss.xml" rel="self" type="application/rss+xml"/>
      ${posts.map((post) => {
    return `<item>
        <title>
        <![CDATA[ ${post.title} ]]>
        </title>
        ${post.description != null ?
        `<description>
        <![CDATA[ ${post.description} ]]>
        </description>` : ''
      }
        <pubDate>${formatDate(post.date)}</pubDate>
        <link>${post.url}</link>
        <guid>${post.url}</guid>
      </item>`}
  ).join('')}
    </channel>
</rss>`
}

export async function GET() {
  return new Response(
    await generateRssFeed(),
    {
      headers: {
        'content-type': 'application/xml'
      }
    }
  )
}