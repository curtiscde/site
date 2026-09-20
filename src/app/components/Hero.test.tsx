import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Hero } from './Hero'
import { config } from '../config'
import type { BannerRow } from '../util/banner'

// Rows are injected rather than read from disk: getBannerRows() walks posts/ and
// parses every markdown file, which is far too much work for a render test and makes
// the assertions depend on whatever happens to be published.
const rows: BannerRow[] = [
  {
    kind: 'title',
    items: [{ label: 'A Post', href: '/post/a-post' }],
    direction: 'left',
    opacity: 0.12,
    durationSeconds: 230,
  },
  {
    kind: 'tag',
    items: [
      { label: 'javascript', href: '/tag/javascript' },
      { label: 'react', href: '/tag/react' },
    ],
    direction: 'right',
    opacity: 0.28,
    durationSeconds: 135,
  },
]

describe('Hero', () => {
  describe('default (no props)', () => {
    it('renders the configured site title', () => {
      render(<Hero rows={rows} />)
      expect(screen.getByRole('heading', { name: config.title })).toBeInTheDocument()
    })

    it('renders the configured subtitle', () => {
      render(<Hero rows={rows} />)
      expect(screen.getByText(config.subtitle)).toBeInTheDocument()
    })
  })

  describe('bare variant', () => {
    it('renders no heading', () => {
      const { container } = render(<Hero variant="bare" rows={rows} />)
      expect(screen.queryByRole('heading')).toBeNull()
      expect(container.querySelector('.hero--bare')).toBeInTheDocument()
    })

    it('renders no site title or subtitle text', () => {
      render(<Hero variant="bare" rows={rows} />)
      expect(screen.queryByText(config.title)).toBeNull()
      expect(screen.queryByText(config.subtitle)).toBeNull()
    })

    it('ignores title, subtitle and tag props', () => {
      render(<Hero variant="bare" title="Uses" subtitle="tools" tag="javascript" rows={rows} />)
      expect(screen.queryByRole('heading')).toBeNull()
      expect(screen.queryByText('Uses')).toBeNull()
    })

    it('still renders the marquee rows', () => {
      const { container } = render(<Hero variant="bare" rows={rows} />)
      expect(container.querySelectorAll('.hero-row')).toHaveLength(rows.length)
    })
  })

  describe('compact variant', () => {
    it('keeps the title and subtitle', () => {
      const { container } = render(
        <Hero variant="compact" title="Curriculum Vitae" subtitle="software engineer" rows={rows} />,
      )
      expect(screen.getByRole('heading', { name: 'Curriculum Vitae' })).toBeInTheDocument()
      expect(screen.getByText('software engineer')).toBeInTheDocument()
      expect(container.querySelector('.hero--compact')).toBeInTheDocument()
    })
  })

  describe('full-height variants', () => {
    it.each([
      ['default', <Hero key="d" rows={rows} />],
      ['tag', <Hero key="t" tag="javascript" rows={rows} />],
      ['title', <Hero key="c" title="Curriculum Vitae" rows={rows} />],
    ])('leaves the %s variant unmodified at full height', (_name, element) => {
      const { container } = render(element)
      expect(container.querySelector('.hero--bare')).toBeNull()
      expect(container.querySelector('.hero--compact')).toBeNull()
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })
  })

  describe('tag variant', () => {
    it('renders the tag heading with a bookmark', () => {
      render(<Hero tag="javascript" rows={rows} />)
      expect(screen.getByRole('heading', { name: /javascript/i })).toBeInTheDocument()
    })

    it('does not render the default site title', () => {
      render(<Hero tag="javascript" rows={rows} />)
      expect(screen.queryByText(config.title)).toBeNull()
    })

    // Both runs, so the highlight does not blink out each time the track wraps.
    it('marks the browsed tag as active in both runs', () => {
      const { container } = render(<Hero tag="javascript" rows={rows} />)
      const active = container.querySelectorAll('.hero-item--active')

      expect(active).toHaveLength(2)
      active.forEach((el) => expect(el).toHaveTextContent('javascript'))
    })

    it('marks nothing active when no tag is being browsed', () => {
      const { container } = render(<Hero rows={rows} />)
      expect(container.querySelectorAll('.hero-item--active')).toHaveLength(0)
    })
  })

  describe('title/subtitle variant', () => {
    it('renders a custom title and subtitle', () => {
      render(<Hero title="Curriculum Vitae" subtitle="software engineer · london" rows={rows} />)
      expect(screen.getByRole('heading', { name: 'Curriculum Vitae' })).toBeInTheDocument()
      expect(screen.getByText('software engineer · london')).toBeInTheDocument()
    })

    it('renders a custom title without a subtitle', () => {
      render(<Hero title="Tag Graph" rows={rows} />)
      expect(screen.getByRole('heading', { name: 'Tag Graph' })).toBeInTheDocument()
    })

    it('takes precedence over the tag variant', () => {
      render(<Hero title="Curriculum Vitae" tag="javascript" rows={rows} />)
      expect(screen.getByRole('heading', { name: 'Curriculum Vitae' })).toBeInTheDocument()
      expect(screen.queryByText(/🔖/)).toBeNull()
    })
  })

  describe('marquee', () => {
    it('renders one track per row, each duplicated for a seamless loop', () => {
      const { container } = render(<Hero rows={rows} />)
      expect(container.querySelectorAll('.hero-row')).toHaveLength(2)
      expect(container.querySelectorAll('.hero-track')).toHaveLength(2)
      expect(container.querySelectorAll('.hero-run')).toHaveLength(4)
    })

    // Regression: the duplicate run used to render spans. The track scrolls to -50%, so
    // for half of every cycle the duplicate IS what you are looking at, which made half
    // the marquee silently unclickable.
    it('links every item in the duplicate run too, not just the first', () => {
      const { container } = render(<Hero rows={rows} />)
      const duplicates = container.querySelectorAll('.hero-run[aria-hidden="true"]')

      expect(duplicates).toHaveLength(2)
      duplicates.forEach((run) => {
        const items = run.querySelectorAll('.hero-item')
        expect(items.length).toBeGreaterThan(0)
        items.forEach((item) => {
          expect(item.tagName).toBe('A')
          expect(item).toHaveAttribute('href')
        })
      })
    })

    it('keeps the duplicate run out of the tab order', () => {
      const { container } = render(<Hero rows={rows} />)
      container.querySelectorAll('.hero-run[aria-hidden="true"] .hero-item').forEach((item) => {
        expect(item).toHaveAttribute('tabindex', '-1')
      })
    })

    it('exposes each href once to the accessibility tree', () => {
      const { container } = render(<Hero rows={rows} />)
      const hrefs = [...container.querySelectorAll('.hero-run:not([aria-hidden]) .hero-item')]
        .map((el) => el.getAttribute('href'))

      expect(hrefs).toEqual(['/post/a-post', '/tag/javascript', '/tag/react'])
    })

    it('carries each row opacity and duration as custom properties', () => {
      const { container } = render(<Hero rows={rows} />)
      const first = container.querySelector('.hero-row') as HTMLElement
      expect(first.style.getPropertyValue('--hero-row-opacity')).toBe('0.12')
      expect(first.style.getPropertyValue('--hero-row-duration')).toBe('230s')
    })

    it('alternates scroll direction row by row', () => {
      const { container } = render(<Hero rows={rows} />)
      expect(container.querySelector('.hero-row--left')).toBeInTheDocument()
      expect(container.querySelector('.hero-row--right')).toBeInTheDocument()
    })
  })
})
