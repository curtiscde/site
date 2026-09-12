import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import fs from 'node:fs'
import path from 'node:path'
import { SiteImage } from './SiteImage'

// SiteImage reads the real build-time manifest, so these exercise the whole path rather
// than an injected fixture. Skipped, not failed, before a first `npm run images`.
const manifestPath = path.join(process.cwd(), 'public', '_img', 'manifest.json')
const maybe = fs.existsSync(manifestPath) ? it : it.skip

describe('SiteImage', () => {
  maybe('serves a variant, never the 347 KB original, for the avatar', () => {
    const { container } = render(<SiteImage src="/images/curtis.png" alt="Curtis" sizes="40px" />)

    expect(container.querySelector('picture')).not.toBeNull()
    expect(container.innerHTML).not.toContain('"/images/curtis.png"')
    expect(container.querySelector('source[type="image/avif"]')).toHaveAttribute(
      'srcset',
      expect.stringContaining('/_img/images/curtis-96.avif 96w')
    )
  })

  maybe('offers AVIF before WebP', () => {
    const { container } = render(<SiteImage src="/images/curtis.png" alt="Curtis" sizes="40px" />)

    const sources = container.querySelectorAll('source')
    expect(sources[0]).toHaveAttribute('type', 'image/avif')
    expect(sources[1]).toHaveAttribute('type', 'image/webp')
  })

  maybe('passes the slot size through, so the browser can pick the small rung', () => {
    const { container } = render(<SiteImage src="/images/curtis.png" alt="Curtis" sizes="40px" />)

    for (const source of container.querySelectorAll('source')) {
      expect(source).toHaveAttribute('sizes', '40px')
    }
  })

  maybe('sets intrinsic dimensions, so chrome images reserve their space', () => {
    render(<SiteImage src="/images/curtis.png" alt="Curtis" sizes="40px" />)

    expect(screen.getByAltText('Curtis')).toHaveAttribute('width', '600')
    expect(screen.getByAltText('Curtis')).toHaveAttribute('height', '600')
  })

  maybe('loads eagerly when marked priority, for the header avatar', () => {
    render(<SiteImage src="/images/curtis.png" alt="Curtis" sizes="40px" priority />)

    expect(screen.getByAltText('Curtis')).toHaveAttribute('loading', 'eager')
  })

  it('falls back to a plain img for an SVG, which the pipeline deliberately skips', () => {
    // Vector logos are already small and rasterising them would be worse. They have no
    // manifest entry, so this needs no branch in SiteImage itself.
    const { container } = render(
      <SiteImage src="/images/logos/tesco.svg" alt="Tesco logo" sizes="56px" />
    )

    expect(container.querySelector('picture')).toBeNull()
    expect(screen.getByAltText('Tesco logo')).toHaveAttribute('src', '/images/logos/tesco.svg')
  })

  it('keeps the className, which the CV tiles rely on for their layout', () => {
    render(
      <SiteImage src="/images/logos/tesco.svg" alt="Tesco logo" sizes="56px" className="rounded-lg" />
    )

    expect(screen.getByAltText('Tesco logo')).toHaveClass('rounded-lg')
  })
})
