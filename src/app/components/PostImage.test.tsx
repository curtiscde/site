import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PostImage } from './PostImage'

const variants = { width: 2488, height: 1642, widths: [400, 800, 1200, 1600] }

describe('PostImage', () => {
  it('serves a variant, never the original, when variants exist', () => {
    const { container } = render(
      <PostImage src="/post/x/cover.png" alt="Cover" sizes="400px" variants={variants} />
    )

    // The regression this guards: next/image with `unoptimized: true` served the 2,488px
    // original into a ~400px card.
    expect(screen.getByAltText('Cover')).toHaveAttribute('src', '/_img/post/x/cover-1600.webp')
    expect(container.innerHTML).not.toContain('"/post/x/cover.png"')
  })

  it('offers AVIF before WebP', () => {
    const { container } = render(
      <PostImage src="/post/x/cover.png" alt="Cover" sizes="400px" variants={variants} />
    )

    const sources = container.querySelectorAll('source')
    expect(sources[0]).toHaveAttribute('type', 'image/avif')
    expect(sources[1]).toHaveAttribute('type', 'image/webp')
  })

  it('builds a full srcset so the browser can pick a card-sized variant', () => {
    const { container } = render(
      <PostImage src="/post/x/cover.png" alt="Cover" sizes="400px" variants={variants} />
    )

    expect(container.querySelector('source[type="image/avif"]')).toHaveAttribute(
      'srcset',
      '/_img/post/x/cover-400.avif 400w, /_img/post/x/cover-800.avif 800w, ' +
        '/_img/post/x/cover-1200.avif 1200w, /_img/post/x/cover-1600.avif 1600w'
    )
  })

  it('passes sizes through to both sources', () => {
    const { container } = render(
      <PostImage src="/post/x/cover.png" alt="Cover" sizes="(max-width: 768px) 100vw, 400px" variants={variants} />
    )

    for (const source of container.querySelectorAll('source')) {
      expect(source).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 400px')
    }
  })

  it('sets intrinsic dimensions, preventing layout shift as cards load', () => {
    render(<PostImage src="/post/x/cover.png" alt="Cover" sizes="400px" variants={variants} />)

    expect(screen.getByAltText('Cover')).toHaveAttribute('width', '2488')
    expect(screen.getByAltText('Cover')).toHaveAttribute('height', '1642')
  })

  it('lazy-loads by default and eagerly when marked priority', () => {
    const { rerender } = render(
      <PostImage src="/post/x/c.png" alt="Cover" sizes="400px" variants={variants} />
    )
    expect(screen.getByAltText('Cover')).toHaveAttribute('loading', 'lazy')

    rerender(<PostImage src="/post/x/c.png" alt="Cover" sizes="400px" variants={variants} priority />)
    expect(screen.getByAltText('Cover')).toHaveAttribute('loading', 'eager')
  })

  describe('without variants', () => {
    it('falls back to the original rather than a file that was never generated', () => {
      const { container } = render(
        <PostImage src="/post/x/animation.gif" alt="Animation" sizes="400px" />
      )

      expect(screen.getByAltText('Animation')).toHaveAttribute('src', '/post/x/animation.gif')
      expect(container.querySelector('picture')).toBeNull()
    })

    it('keeps dimensions when the generator measured but did not encode the source', () => {
      const { container } = render(
        <PostImage
          src="/post/x/animation.gif"
          alt="Animation"
          sizes="400px"
          variants={{ width: 416, height: 154, widths: [] }}
        />
      )

      // An empty `widths` must not become src="…-undefined.webp".
      expect(container.querySelector('picture')).toBeNull()
      expect(screen.getByAltText('Animation')).toHaveAttribute('src', '/post/x/animation.gif')
      expect(screen.getByAltText('Animation')).toHaveAttribute('width', '416')
      expect(screen.getByAltText('Animation')).toHaveAttribute('height', '154')
    })
  })
})
