import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RelatedPosts } from './RelatedPosts'
import { Post } from '../types'

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: '1',
  title: 'Test Post',
  slug: 'test-post',
  date: new Date('2020-06-01T00:00:00'),
  dateFormatted: '1st Jun 2020',
  description: 'A test description',
  tags: ['javascript'],
  imageThumbnailUrl: undefined,
  contentHtml: '<p>Content</p>',
  path: '/post/test-post',
  url: 'https://www.curtiscode.dev/post/test-post',
  ...overrides,
})

describe('RelatedPosts', () => {
  it('renders a heading', () => {
    render(<RelatedPosts posts={[makePost()]} />)

    expect(screen.getByRole('heading', { name: 'Continue Reading' })).toBeInTheDocument()
  })

  it('renders a card per post, linking to each', () => {
    const posts = [
      makePost({ id: '1', title: 'First', slug: 'first' }),
      makePost({ id: '2', title: 'Second', slug: 'second' }),
      makePost({ id: '3', title: 'Third', slug: 'third' }),
    ]

    render(<RelatedPosts posts={posts} />)

    expect(screen.getByRole('link', { name: /First/ })).toHaveAttribute('href', '/post/first')
    expect(screen.getByRole('link', { name: /Second/ })).toHaveAttribute('href', '/post/second')
    expect(screen.getByRole('link', { name: /Third/ })).toHaveAttribute('href', '/post/third')
  })

  it('still renders the heading when there are no posts', () => {
    // PostPage guards on length before rendering this, but the component itself
    // should not depend on that guard.
    const { container } = render(<RelatedPosts posts={[]} />)

    expect(screen.getByRole('heading', { name: 'Continue Reading' })).toBeInTheDocument()
    expect(container.querySelectorAll('a')).toHaveLength(0)
  })
})
