import { getPosts } from '../util/posts'
import { config } from '../config'

export const dynamic = 'force-static'

function formatDateToRFC822(date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayOfWeek = days[date.getUTCDay()];
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${dayOfWeek}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} GMT`;
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
      <lastBuildDate>${formatDateToRFC822(latestPost.date)}</lastBuildDate>
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
        <pubDate>${formatDateToRFC822(post.date)}</pubDate>
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