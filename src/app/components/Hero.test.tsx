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

  describe('compact variant', () => {
    it('renders no heading', () => {
      const { container } = render(<Hero compact />)
      expect(screen.queryByRole('heading')).toBeNull()
      expect(container.querySelector('.hero--compact')).toBeInTheDocument()
    })

    it('renders no site title or subtitle text', () => {
      render(<Hero compact />)
      expect(screen.queryByText(config.title)).toBeNull()
      expect(screen.queryByText(config.subtitle)).toBeNull()
    })

    it('ignores title, subtitle and tag props', () => {
      render(<Hero compact title="Uses" subtitle="tools" tag="javascript" />)
      expect(screen.queryByRole('heading')).toBeNull()
      expect(screen.queryByText('Uses')).toBeNull()
    })
  })

  describe('full-height variants', () => {
    it.each([
      ['default', <Hero key="d" />],
      ['tag', <Hero key="t" tag="javascript" />],
      ['title', <Hero key="c" title="Curriculum Vitae" />],
    ])('does not apply the compact modifier to the %s variant', (_name, element) => {
      const { container } = render(element)
      expect(container.querySelector('.hero--compact')).toBeNull()
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
