import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RelatedTags } from './RelatedTags'

describe('RelatedTags', () => {
  const relatedTags = [
    { tag: 'react', sharedCount: 3, postCount: 4 },
    { tag: 'c-sharp', sharedCount: 1, postCount: 1 },
  ]

  it('renders a heading inside a labelled nav', () => {
    render(<RelatedTags tag="javascript" relatedTags={relatedTags} />)

    expect(screen.getByRole('navigation', { name: 'Related tags' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Related Tags' })).toBeInTheDocument()
  })

  it('links a card to each related tag, using its display name', () => {
    render(<RelatedTags tag="javascript" relatedTags={relatedTags} />)

    expect(screen.getByRole('link', { name: /react/ })).toHaveAttribute('href', '/tag/react')
    expect(screen.getByRole('link', { name: /c#/ })).toHaveAttribute('href', '/tag/c-sharp')
  })

  it('shows how many posts each tag has, and how many it shares', () => {
    render(<RelatedTags tag="javascript" relatedTags={relatedTags} />)

    const react = screen.getByRole('link', { name: /react/ })
    expect(react).toHaveTextContent('4 posts')
    expect(react).toHaveTextContent('3 shared with javascript')

    const cSharp = screen.getByRole('link', { name: /c#/ })
    expect(cSharp).toHaveTextContent('1 post')
    expect(cSharp).not.toHaveTextContent('1 posts')
  })

  it('links to the tag graph', () => {
    render(<RelatedTags tag="javascript" relatedTags={relatedTags} />)

    expect(screen.getByRole('link', { name: /Explore all tags/ })).toHaveAttribute('href', '/tags')
  })

  it('renders nothing when there are no related tags', () => {
    const { container } = render(<RelatedTags tag="warp" relatedTags={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
