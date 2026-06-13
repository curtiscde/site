import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Footer } from './Footer'
import { Post, TagCount } from '../../types'
import { config } from '../../config'

const makePost = (id: string, title: string, slug: string): Post => ({
  id,
  title,
  slug,
  date: new Date('2026-06-01T00:00:00'),
  dateFormatted: '1st Jun 2026',
  description: 'desc',
  tags: ['javascript'],
  imageThumbnailUrl: undefined,
  contentHtml: '<p>Content</p>',
  path: `/post/${slug}`,
  url: `${config.url}/post/${slug}`,
})

const recentPosts: Post[] = [
  makePost('1', 'First Post', 'first-post'),
  makePost('2', 'Second Post', 'second-post'),
]

// 15 tags so the 12-tag inline slice leaves "+ 3 more". The (tag, count)
// pairs are chosen so smart (input order), count (desc) and alpha orderings
// all differ and have unambiguous leaders:
//   - input order leader:   "typescript"
//   - highest count:        "react" (25), then "nextjs" (15)
//   - alphabetically first: "api"
const topTags: TagCount[] = [
  { tag: 'typescript', count: 8, smartScore: 0 },
  { tag: 'react', count: 25, smartScore: 0 },
  { tag: 'css', count: 3, smartScore: 0 },
  { tag: 'node', count: 12, smartScore: 0 },
  { tag: 'jest', count: 1, smartScore: 0 },
  { tag: 'nextjs', count: 15, smartScore: 0 },
  { tag: 'html', count: 5, smartScore: 0 },
  { tag: 'api', count: 7, smartScore: 0 },
  { tag: 'docker', count: 9, smartScore: 0 },
  { tag: 'aws', count: 4, smartScore: 0 },
  { tag: 'graphql', count: 6, smartScore: 0 },
  { tag: 'testing', count: 10, smartScore: 0 },
  { tag: 'zustand', count: 2, smartScore: 0 },
  { tag: 'babel', count: 11, smartScore: 0 },
  { tag: 'webpack', count: 13, smartScore: 0 },
]

const getDialog = () => document.querySelector('dialog') as HTMLDialogElement

// Order of tags currently shown inside the modal's tag list. The sort menu
// items are anchors without an href, so they are not exposed as links — only
// the tag links are returned here.
const modalTagOrder = () =>
  within(getDialog())
    // The dialog is closed in jsdom (showModal is a no-op stub), so its
    // contents count as hidden — opt them back in for the role query.
    .getAllByRole('link', { hidden: true })
    .map((link) => link.textContent)

describe('Footer', () => {
  // jsdom does not implement HTMLDialogElement.showModal / close.
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = jest.fn()
    HTMLDialogElement.prototype.close = jest.fn()
  })

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-06-13T00:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders each recent post as a link to its path', () => {
    render(<Footer recentPosts={recentPosts} topTags={topTags} />)

    expect(screen.getByRole('link', { name: 'First Post' })).toHaveAttribute('href', '/post/first-post')
    expect(screen.getByRole('link', { name: 'Second Post' })).toHaveAttribute('href', '/post/second-post')
  })

  it('renders only the first 12 tags inline with a "+ 3 more" badge', () => {
    render(<Footer recentPosts={recentPosts} topTags={topTags} />)

    const moreBadge = screen.getByText('+ 3 more')
    const inlineTags = moreBadge.parentElement as HTMLElement

    expect(within(inlineTags).getAllByRole('link')).toHaveLength(12)
    // Tag 13 onwards (babel, webpack, zustand) is not in the inline list.
    expect(within(inlineTags).queryByText('babel')).toBeNull()
  })

  it('renders the copyright with the site title and current year', () => {
    render(<Footer recentPosts={recentPosts} topTags={topTags} />)

    expect(screen.getByText(`All rights reserved © ${config.title} 2026`)).toBeInTheDocument()
  })

  describe('modal tag sorting', () => {
    const openModal = () => fireEvent.click(screen.getByText('+ 3 more'))

    it('defaults to relevance order (input order preserved)', () => {
      render(<Footer recentPosts={recentPosts} topTags={topTags} />)
      openModal()

      expect(modalTagOrder()[0]).toBe('typescript')
    })

    it('orders by descending count when "Count" is selected', () => {
      render(<Footer recentPosts={recentPosts} topTags={topTags} />)
      openModal()

      fireEvent.click(within(getDialog()).getByText('Count'))

      const order = modalTagOrder()
      expect(order[0]).toBe('react')
      expect(order[1]).toBe('nextjs')
      expect(order[order.length - 1]).toBe('jest')
    })

    it('orders alphabetically when "A–Z" is selected', () => {
      render(<Footer recentPosts={recentPosts} topTags={topTags} />)
      openModal()

      fireEvent.click(within(getDialog()).getByText('A–Z'))

      const order = modalTagOrder()
      expect(order[0]).toBe('api')
      expect(order[order.length - 1]).toBe('zustand')
    })
  })
})
