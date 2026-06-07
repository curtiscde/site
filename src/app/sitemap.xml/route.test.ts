/**
 * @jest-environment node
 */
import { getPosts } from '../util/posts'
import { config } from '../config'
import { GET } from './route'
import type { Post } from '../types'

jest.mock('../util/posts', () => {
  const actual = jest.requireActual('../util/posts')
  return {
    ...actual,
    getPosts: jest.fn(),
  }
})

const mockGetPosts = getPosts as jest.Mock

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    title: 'A Post',
    slug: 'a-post',
    date: new Date('2024-01-01T00:00:00.000Z'),
    url: 'https://www.curtiscode.dev/post/a-post',
    tags: ['foo'],
    content: 'content',
    ...overrides,
  } as Post
}

function lastmodForTag(body: string, tag: string): string | null {
  const re = new RegExp(
    `<loc>${config.url}/tag/${tag}</loc>\\s*<lastmod>([^<]+)</lastmod>`,
  )
  const match = body.match(re)
  return match ? match[1] : null
}

async function getBody() {
  const res = await GET()
  return { res, body: await res.text() }
}

describe('sitemap.xml GET', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const posts = [
    makePost({
      url: 'https://www.curtiscode.dev/post/a',
      tags: ['foo'],
      date: new Date('2024-01-01T00:00:00.000Z'),
    }),
    makePost({
      url: 'https://www.curtiscode.dev/post/b',
      tags: ['foo', 'bar'],
      date: new Date('2024-03-01T00:00:00.000Z'),
    }),
    makePost({
      url: 'https://www.curtiscode.dev/post/c',
      tags: ['bar'],
      date: new Date('2024-05-01T00:00:00.000Z'),
    }),
  ]

  it('responds with application/xml content type', async () => {
    mockGetPosts.mockReturnValue(posts)
    const { res } = await getBody()
    expect(res.headers.get('content-type')).toBe('application/xml')
  })

  it('includes the homepage url', async () => {
    mockGetPosts.mockReturnValue(posts)
    const { body } = await getBody()
    expect(body).toContain('<loc>https://www.curtiscode.dev/</loc>')
  })

  it('includes a url for each post using the ISO date as lastmod', async () => {
    mockGetPosts.mockReturnValue(posts)
    const { body } = await getBody()
    for (const post of posts) {
      expect(body).toContain(`<loc>${post.url}</loc>`)
      expect(body).toContain(`<lastmod>${post.date.toISOString()}</lastmod>`)
    }
  })

  it('includes a url for each top tag', async () => {
    mockGetPosts.mockReturnValue(posts)
    const { body } = await getBody()
    expect(body).toContain(`<loc>${config.url}/tag/foo</loc>`)
    expect(body).toContain(`<loc>${config.url}/tag/bar</loc>`)
  })

  it('uses the newest post date as lastmod for each tag', async () => {
    mockGetPosts.mockReturnValue(posts)
    const { body } = await getBody()
    // foo: newest is post b (2024-03-01); bar: newest is post c (2024-05-01)
    expect(lastmodForTag(body, 'foo')).toBe(
      new Date('2024-03-01T00:00:00.000Z').toISOString(),
    )
    expect(lastmodForTag(body, 'bar')).toBe(
      new Date('2024-05-01T00:00:00.000Z').toISOString(),
    )
  })
})
