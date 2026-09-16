import React from 'react'
import { render } from '@testing-library/react'
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
