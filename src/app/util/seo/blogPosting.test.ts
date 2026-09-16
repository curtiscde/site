import { buildBlogPosting, escapeJsonLd } from './blogPosting'
import { transformPost, type RawPost, type Post } from '../../types/Post'
import { config } from '../../config'

const post = (overrides: Partial<RawPost> = {}): Post =>
  transformPost({
    id: '1',
    title: 'A Post',
    slug: 'a-post',
    date: new Date('2026-01-15T00:00:00Z'),
    tags: ['typescript', 'testing'],
    content: '# Heading\n\nSome body text.',
    ...overrides,
  } as RawPost)

const parsed = (p: Post) => JSON.parse(buildBlogPosting(p))

describe('buildBlogPosting', () => {
  it('declares itself as a schema.org BlogPosting', () => {
    expect(parsed(post())).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
    })
  })

  it('carries the fields a crawler reads', () => {
    const data = parsed(post())

    expect(data.headline).toBe('A Post')
    expect(data.datePublished).toBe('2026-01-15T00:00:00.000Z')
    expect(data.keywords).toBe('typescript, testing')
    expect(data.mainEntityOfPage).toEqual({ '@type': 'WebPage', '@id': 'https://www.curtiscode.dev/post/a-post' })
  })

  it('falls back to the title when a post has no description', () => {
    expect(parsed(post()).description).toBe('A Post')
    expect(parsed(post({ description: 'A real description' })).description).toBe('A real description')
  })

  it('falls back to the site owner when a post names no author', () => {
    expect(parsed(post()).author).toEqual({ '@type': 'Person', name: config.title })
    expect(parsed(post({ author: 'Someone Else' })).author.name).toBe('Someone Else')
  })

  it('makes the image absolute, since a crawler has no page context', () => {
    const data = parsed(post({ image: '/post/a-post/cover.png' }))

    expect(data.image).toBe('https://www.curtiscode.dev/post/a-post/cover.png')
  })

  it('omits image entirely when the post has no cover', () => {
    expect('image' in parsed(post())).toBe(false)
  })

  it('does not embed the article body', () => {
    // It used to carry `contentHtml` — the rendered article, markup and all. That is not
    // what schema.org's articleBody means, and it added 16-25 KB to every article page
    // for a property Google does not use for Article results.
    const json = buildBlogPosting(post())

    expect(json).not.toContain('articleBody')
    expect(json).not.toContain('<h1')
  })
})

describe('escapeJsonLd', () => {
  it('neutralises a closing script tag hidden in a post title', () => {
    // Without this, a title containing </script> would close the element and everything
    // after it would parse as markup.
    const json = buildBlogPosting(post({ title: 'Breaking out </script><script>alert(1)</script>' }))

    const escaped = escapeJsonLd(json)

    expect(escaped).not.toContain('</script>')
    expect(escaped).not.toContain('<script>')
    expect(escaped).toContain('\\u003c')
  })

  it('leaves the JSON semantically identical', () => {
    const data = post({ title: 'Angles < and > and & ampersand' })

    // A JSON parser reads < as '<', so escaping changes bytes, never meaning.
    expect(JSON.parse(escapeJsonLd(buildBlogPosting(data))).headline).toBe(
      'Angles < and > and & ampersand'
    )
  })

  it('escapes every character that can start a tag-like sequence', () => {
    expect(escapeJsonLd('<>&')).toBe('\\u003c\\u003e\\u0026')
  })
})
