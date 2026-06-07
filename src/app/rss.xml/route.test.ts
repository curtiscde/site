/**
 * @jest-environment node
 */
import { getPosts } from '../util/posts'
import { config } from '../config'
import { formatDateToRFC822 } from './formatDateToRFC822'
import { GET } from './route'
import type { Post } from '../types'

jest.mock('../util/posts', () => ({
  getPosts: jest.fn(),
}))

const mockGetPosts = getPosts as jest.Mock

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    title: 'A Post',
    slug: 'a-post',
    description: 'A description',
    date: new Date('2024-01-02T03:04:05Z'),
    url: 'https://www.curtiscode.dev/post/a-post',
    tags: ['foo'],
    content: 'content',
    ...overrides,
  } as Post
}

async function getBody() {
  const res = await GET()
  return { res, body: await res.text() }
}

describe('rss.xml GET', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('responds with application/xml content type', async () => {
    mockGetPosts.mockReturnValue([makePost()])
    const { res } = await getBody()
    expect(res.headers.get('content-type')).toBe('application/xml')
  })

  it('uses the channel title, link and description from config', async () => {
    mockGetPosts.mockReturnValue([makePost()])
    const { body } = await getBody()
    expect(body).toContain(`<title>${config.title}</title>`)
    expect(body).toContain(`<link>${config.url}</link>`)
    expect(body).toContain(`<description>${config.rssFeedDescription}</description>`)
  })

  it('renders one <item> per post', async () => {
    mockGetPosts.mockReturnValue([
      makePost({ url: 'https://www.curtiscode.dev/post/one' }),
      makePost({ url: 'https://www.curtiscode.dev/post/two' }),
      makePost({ url: 'https://www.curtiscode.dev/post/three' }),
    ])
    const { body } = await getBody()
    expect((body.match(/<item>/g) ?? []).length).toBe(3)
  })

  it('renders a CDATA description only for posts that have one', async () => {
    mockGetPosts.mockReturnValue([
      makePost({ title: 'With Desc', description: 'Has a description' }),
      makePost({ title: 'No Desc', description: undefined }),
    ])
    const { body } = await getBody()
    expect(body).toContain('<![CDATA[ Has a description ]]>')
    // One channel-level <description> plus exactly one item-level description
    expect((body.match(/<description>/g) ?? []).length).toBe(2)
  })

  it('formats pubDate and lastBuildDate as RFC-822', async () => {
    const date = new Date('2024-01-02T03:04:05Z')
    mockGetPosts.mockReturnValue([makePost({ date })])
    const { body } = await getBody()
    const expected = formatDateToRFC822(date)
    expect(body).toContain(`<pubDate>${expected}</pubDate>`)
    expect(body).toContain(`<lastBuildDate>${expected}</lastBuildDate>`)
  })

  it('caps the feed at 50 items', async () => {
    const posts = Array.from({ length: 60 }, (_, i) =>
      makePost({ url: `https://www.curtiscode.dev/post/${i}` }),
    )
    mockGetPosts.mockReturnValue(posts)
    const { body } = await getBody()
    expect((body.match(/<item>/g) ?? []).length).toBe(50)
  })
})
