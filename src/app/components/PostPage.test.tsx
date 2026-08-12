import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PostPage } from './PostPage'
import { Post } from '../types'
import { config } from '../config'

jest.mock('./Header', () => ({
  Header: () => <header data-testid="header" />,
}))

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
  content: 'Content',
  contentHtml: '<p>Content</p>',
  path: '/post/test-post',
  url: 'https://www.curtiscode.dev/post/test-post',
}

// The JSON-LD is injected into document.head by an effect, not into the container.
const getStructuredData = () => {
  const script = document.head.querySelector('script[type="application/ld+json"]')
  return JSON.parse(script?.textContent ?? '{}')
}

describe('PostPage JSON-LD author', () => {
  it('falls back to the site title when the post has no author', () => {
    render(<PostPage post={basePost} relatedPosts={[]} />)
    expect(getStructuredData().author).toEqual({
      '@type': 'Person',
      name: config.title,
    })
  })

  it("uses the post's own author when one is set", () => {
    const authoredPost = { ...basePost, author: 'Guest Writer' }
    render(<PostPage post={authoredPost} relatedPosts={[]} />)
    expect(getStructuredData().author.name).toBe('Guest Writer')
  })
})
