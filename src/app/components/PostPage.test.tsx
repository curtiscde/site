import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PostPage } from './PostPage'
import { Post } from '../types'

jest.mock('./RelatedPosts', () => ({
  RelatedPosts: () => <aside data-testid="related-posts" />,
}))

jest.mock('./Comments/Comments', () => ({
  Comments: () => <section data-testid="comments" />,
}))

const basePost: Post = {
  id: '1',
  title: 'Test Post',
  slug: 'test-post',
  date: new Date('2026-06-01T00:00:00'),
  dateFormatted: '1st Jun 2026',
  description: 'A test description',
  tags: ['javascript'],
  imageThumbnailUrl: undefined,
  contentHtml: '<p>Content</p>',
  path: '/post/test-post',
  url: 'https://www.curtiscode.dev/post/test-post',
}

// JSON-LD is built and rendered by the route now, not by this component — see
// util/seo/blogPosting.test.ts. It used to be appended to document.head from an effect
// here, which is exactly why it never reached the served HTML.

describe('PostPage tag badges', () => {
  it('links a tag badge to the slug while showing the display name', () => {
    render(<PostPage post={{ ...basePost, tags: ['c-sharp', 'javascript'] }} relatedPosts={[]} />)

    const link = screen.getByRole('link', { name: 'c#' })

    expect(link).toHaveAttribute('href', '/tag/c-sharp')
    expect(screen.getByRole('link', { name: 'javascript' })).toHaveAttribute('href', '/tag/javascript')
  })
})

describe('PostPage article content', () => {
  const highlightedPost: Post = {
    ...basePost,
    contentHtml: '<pre><code class="hljs language-js">'
      + '<span class="hljs-keyword">const</span> a = 1;'
      + '</code></pre>',
  }

  it('renders pre-highlighted markup verbatim', () => {
    const { container } = render(<PostPage post={highlightedPost} relatedPosts={[]} />)
    const code = container.querySelector('pre code')
    expect(code).toHaveClass('hljs', 'language-js')
    expect(code?.querySelector('.hljs-keyword')).toBeInTheDocument()
  })

  // Highlighting moved to build time. If a client-side pass is ever reintroduced it will
  // rewrite this markup on mount, so assert the DOM is untouched after the effects run.
  it('does not re-highlight on the client', () => {
    const { container } = render(<PostPage post={highlightedPost} relatedPosts={[]} />)
    expect(container.querySelector('pre code')?.innerHTML).toBe(
      '<span class="hljs-keyword">const</span> a = 1;'
    )
  })
})

describe('PostPage code copy', () => {
  const codePost: Post = {
    ...basePost,
    contentHtml: '<div class="code-block" data-language="js">'
      + '<pre><code class="hljs language-js">a</code></pre>'
      + '<button type="button" class="code-block__copy" aria-label="Copy code" hidden></button>'
      + '</div>',
  }

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: jest.fn() }, configurable: true })
  })

  it('brings the build-time copy buttons to life', () => {
    render(<PostPage post={codePost} relatedPosts={[]} />)
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeVisible()
  })

  it('keeps the article DOM when it re-renders with the same content', () => {
    // React compares `dangerouslySetInnerHTML` by object identity, so a fresh
    // `{ __html }` on every render re-sets innerHTML and wipes what the copy buttons
    // and the lightbox have done to it.
    const { rerender } = render(<PostPage post={codePost} relatedPosts={[]} />)
    rerender(<PostPage post={{ ...codePost }} relatedPosts={[]} />)
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeVisible()
  })

  it('renders one live region for the copy announcements', () => {
    const { container } = render(<PostPage post={codePost} relatedPosts={[]} />)
    expect(container.querySelectorAll('[aria-live="polite"]')).toHaveLength(1)
  })
})
