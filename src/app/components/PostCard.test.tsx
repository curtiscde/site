import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PostCard } from './PostCard'
import { Post } from '../types'

const basePost: Post = {
  id: '1',
  title: 'Test Post',
  slug: 'test-post',
  date: new Date('2026-06-01T00:00:00'),
  dateFormatted: '1st Jun 2026',
  description: 'A test description',
  tags: ['javascript', 'typescript'],
  imageThumbnailUrl: undefined,
  contentHtml: '<p>Content</p>',
  path: '/post/test-post',
  url: 'https://www.curtiscode.dev/post/test-post',
}

describe('PostCard', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-06-11T00:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the post title', () => {
    render(<PostCard data={basePost} />)
    expect(screen.getByRole('heading', { name: /Test Post/i })).toBeInTheDocument()
  })

  it('renders the formatted date', () => {
    render(<PostCard data={basePost} />)
    expect(screen.getByText('1st Jun 2026')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<PostCard data={basePost} />)
    expect(screen.getByText('A test description')).toBeInTheDocument()
  })

  it('links to the correct post URL', () => {
    render(<PostCard data={basePost} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/post/test-post')
  })

  describe('NEW badge', () => {
    it('shows NEW badge when post is within the last month', () => {
      const recentPost = { ...basePost, date: new Date('2026-05-20T00:00:00') }
      render(<PostCard data={recentPost} />)
      expect(screen.getByText('NEW')).toBeInTheDocument()
    })

    it('does not show NEW badge when post is older than one month', () => {
      const oldPost = { ...basePost, date: new Date('2026-04-01T00:00:00') }
      render(<PostCard data={oldPost} />)
      expect(screen.queryByText('NEW')).toBeNull()
    })
  })

  describe('thumbnail image', () => {
    it('renders the image when imageThumbnailUrl is set', () => {
      const postWithImage = { ...basePost, imageThumbnailUrl: '/post/test-post/cover.jpg' }
      render(<PostCard data={postWithImage} />)
      expect(screen.getByRole('img', { name: 'Test Post' })).toBeInTheDocument()
    })

    it('does not render an image when imageThumbnailUrl is undefined', () => {
      render(<PostCard data={basePost} />)
      expect(screen.queryByRole('img')).toBeNull()
    })
  })

  describe('tags', () => {
    it('renders all tags when provided', () => {
      render(<PostCard data={basePost} />)
      expect(screen.getByText('javascript')).toBeInTheDocument()
      expect(screen.getByText('typescript')).toBeInTheDocument()
    })

    it('does not render any tag elements when tags is null', () => {
      const postWithoutTags = { ...basePost, tags: null as unknown as string[] }
      render(<PostCard data={postWithoutTags} />)
      expect(screen.queryByText('javascript')).toBeNull()
    })
  })
})
