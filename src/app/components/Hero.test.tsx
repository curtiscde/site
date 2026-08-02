import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Hero } from './Hero'
import { config } from '../config'

describe('Hero', () => {
  describe('default (no props)', () => {
    it('renders the configured site title', () => {
      render(<Hero />)
      expect(screen.getByRole('heading', { name: config.title })).toBeInTheDocument()
    })

    it('renders the configured subtitle', () => {
      render(<Hero />)
      expect(screen.getByText(config.subtitle)).toBeInTheDocument()
    })
  })

  describe('bare variant', () => {
    it('renders no heading', () => {
      const { container } = render(<Hero variant="bare" />)
      expect(screen.queryByRole('heading')).toBeNull()
      expect(container.querySelector('.hero--bare')).toBeInTheDocument()
    })

    it('renders no site title or subtitle text', () => {
      render(<Hero variant="bare" />)
      expect(screen.queryByText(config.title)).toBeNull()
      expect(screen.queryByText(config.subtitle)).toBeNull()
    })

    it('ignores title, subtitle and tag props', () => {
      render(<Hero variant="bare" title="Uses" subtitle="tools" tag="javascript" />)
      expect(screen.queryByRole('heading')).toBeNull()
      expect(screen.queryByText('Uses')).toBeNull()
    })
  })

  describe('compact variant', () => {
    it('keeps the title and subtitle', () => {
      const { container } = render(<Hero variant="compact" title="Curriculum Vitae" subtitle="software engineer" />)
      expect(screen.getByRole('heading', { name: 'Curriculum Vitae' })).toBeInTheDocument()
      expect(screen.getByText('software engineer')).toBeInTheDocument()
      expect(container.querySelector('.hero--compact')).toBeInTheDocument()
    })

    it('halves the vertical padding', () => {
      const { container } = render(<Hero variant="compact" title="Curriculum Vitae" />)
      const content = container.querySelector('.hero-content')
      expect(content).toHaveClass('py-10')
      expect(content).not.toHaveClass('py-20')
    })
  })

  describe('full-height variants', () => {
    it.each([
      ['default', <Hero key="d" />],
      ['tag', <Hero key="t" tag="javascript" />],
      ['title', <Hero key="c" title="Curriculum Vitae" />],
    ])('leaves the %s variant unmodified at full height', (_name, element) => {
      const { container } = render(element)
      expect(container.querySelector('.hero--bare')).toBeNull()
      expect(container.querySelector('.hero--compact')).toBeNull()
      expect(container.querySelector('.hero-content')).toHaveClass('py-20')
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })
  })

  describe('tag variant', () => {
    it('renders the tag heading with a bookmark', () => {
      render(<Hero tag="javascript" />)
      expect(screen.getByRole('heading', { name: /javascript/i })).toBeInTheDocument()
    })

    it('does not render the default site title', () => {
      render(<Hero tag="javascript" />)
      expect(screen.queryByText(config.title)).toBeNull()
    })
  })

  describe('title/subtitle variant', () => {
    it('renders a custom title and subtitle', () => {
      render(<Hero title="Curriculum Vitae" subtitle="software engineer · london" />)
      expect(screen.getByRole('heading', { name: 'Curriculum Vitae' })).toBeInTheDocument()
      expect(screen.getByText('software engineer · london')).toBeInTheDocument()
    })

    it('renders a custom title without a subtitle', () => {
      render(<Hero title="Tag Graph" />)
      expect(screen.getByRole('heading', { name: 'Tag Graph' })).toBeInTheDocument()
    })

    it('takes precedence over the tag variant', () => {
      render(<Hero title="Curriculum Vitae" tag="javascript" />)
      expect(screen.getByRole('heading', { name: 'Curriculum Vitae' })).toBeInTheDocument()
      expect(screen.queryByText(/🔖/)).toBeNull()
    })
  })
})
