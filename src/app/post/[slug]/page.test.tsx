import { render } from '@testing-library/react'
import type { ResolvingMetadata } from 'next'
import Page, { generateMetadata, generateStaticParams } from './page'
import { getPosts } from '@/app/util/posts'
import { transformPost, type Post, type RawPost } from '@/app/types/Post'

jest.mock('@/app/util/posts', () => ({
  ...jest.requireActual('@/app/util/posts'),
  getPosts: jest.fn(),
}))

// Site chrome and the article body have their own tests; this file is about the route.
jest.mock('@/app/components/Header', () => ({ Header: () => null }))
jest.mock('@/app/components/PostPage', () => ({ PostPage: () => null }))

const mockGetPosts = getPosts as jest.Mock

const post = (overrides: Partial<RawPost> = {}): Post =>
  transformPost({
    id: '1',
    title: 'A Post',
    slug: 'a-post',
    description: 'A description',
    date: new Date('2026-01-15T00:00:00Z'),
    tags: ['typescript'],
    content: 'Some body text.',
    ...overrides,
  } as RawPost)

const params = (slug: string) => Promise.resolve({ slug })
const parent = (openGraph: object | null = null) =>
  Promise.resolve({ openGraph }) as unknown as ResolvingMetadata

const metadataFor = (slug = 'a-post', parentOpenGraph: object | null = null) =>
  generateMetadata({ params: params(slug) }, parent(parentOpenGraph))

afterEach(() => {
  jest.clearAllMocks()
})

describe('generateMetadata', () => {
  it('titles the page after the post and points the canonical URL at it', async () => {
    mockGetPosts.mockReturnValue([post()])

    const metadata = await metadataFor()

    expect(metadata.title).toBe('A Post | Curtis Lane | Software Engineer')
    expect(metadata.description).toBe('A description')
    expect(metadata.alternates?.canonical).toBe('https://www.curtiscode.dev/post/a-post')
  })

  // The Open Graph spec defines `article:published_time` as an ISO 8601 datetime.
  it('publishes the post date as ISO 8601', async () => {
    mockGetPosts.mockReturnValue([post()])

    const metadata = await metadataFor()

    expect(metadata.openGraph).toMatchObject({ publishedTime: '2026-01-15T00:00:00.000Z' })
  })

  it('shares the cover image at an absolute URL', async () => {
    mockGetPosts.mockReturnValue([post({ image: '/post/a-post/cover.jpg' })])

    const metadata = await metadataFor()

    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['https://www.curtiscode.dev/post/a-post/cover.jpg'],
    })
    expect(metadata.openGraph).toMatchObject({
      images: [{ url: 'https://www.curtiscode.dev/post/a-post/cover.jpg', width: 1200, height: 630, alt: 'A Post' }],
    })
  })

  it('leaves images out when the post has no cover', async () => {
    mockGetPosts.mockReturnValue([post()])

    const metadata = await metadataFor()

    expect(metadata.twitter).not.toHaveProperty('images')
    expect(metadata.openGraph).not.toHaveProperty('images')
  })

  it('credits the author when the post names one', async () => {
    mockGetPosts.mockReturnValue([post({ author: 'Jane Doe' })])

    const metadata = await metadataFor()

    expect(metadata.authors).toEqual([{ name: 'Jane Doe' }])
    expect(metadata.openGraph).toMatchObject({ authors: ['Jane Doe'] })
  })

  it('omits authors when the post names none', async () => {
    mockGetPosts.mockReturnValue([post()])

    const metadata = await metadataFor()

    expect(metadata.authors).toBeUndefined()
    expect(metadata.openGraph).toMatchObject({ authors: undefined })
  })

  // `article:tag` is read as prose, so it carries the display name, not the URL slug.
  it('tags the article with display names', async () => {
    mockGetPosts.mockReturnValue([post({ tags: ['c-sharp', 'typescript'] })])

    const metadata = await metadataFor()

    expect(metadata.openGraph).toMatchObject({ tags: ['c#', 'typescript'] })
  })

  it('keeps inherited Open Graph fields and overrides them with the post', async () => {
    mockGetPosts.mockReturnValue([post()])

    const metadata = await metadataFor('a-post', { locale: 'en_GB', title: 'Site default', type: 'website' })

    expect(metadata.openGraph).toMatchObject({
      locale: 'en_GB',
      title: 'A Post',
      type: 'article',
      url: 'https://www.curtiscode.dev/post/a-post',
      siteName: 'Curtis Lane',
    })
  })

  it('throws for a slug with no post', async () => {
    mockGetPosts.mockReturnValue([post()])

    await expect(metadataFor('no-such-post')).rejects.toThrow('post not found')
  })
})

describe('generateStaticParams', () => {
  it('pre-renders one page per post', async () => {
    mockGetPosts.mockReturnValue([post({ slug: 'first' }), post({ slug: 'second' })])

    expect(await generateStaticParams()).toEqual([{ slug: 'first' }, { slug: 'second' }])
  })
})

describe('Page', () => {
  // Server-rendered rather than injected from an effect, so crawlers that do not run
  // JavaScript still see it.
  it('renders the BlogPosting JSON-LD into the page', async () => {
    mockGetPosts.mockReturnValue([post()])

    const { container } = render(await Page({ params: params('a-post') }))

    const script = container.querySelector('script[type="application/ld+json"]')
    expect(JSON.parse(script!.innerHTML)).toMatchObject({
      '@type': 'BlogPosting',
      headline: 'A Post',
      datePublished: '2026-01-15T00:00:00.000Z',
    })
  })

  it('throws for a slug with no post', async () => {
    mockGetPosts.mockReturnValue([post()])

    await expect(Page({ params: params('no-such-post') })).rejects.toThrow('post not found')
  })
})
