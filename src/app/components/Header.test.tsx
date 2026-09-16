import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Header } from './Header'
import { config } from '../config'

jest.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle" />,
}))

jest.mock('./NavLinks', () => ({
  NavLinks: () => <nav data-testid="nav-links" />,
}))

// Mocked like the other children above. SiteImage reads the build-time manifest from
// disk, so asserting on its real output would make this file pass or fail depending on
// whether `npm run images` has run — which differs between the two CI workflows. What
// Header is responsible for is passing the right props; that the resolved output is a
// variant is SiteImage's own test, and check:bundle asserts it across all 203 built pages.
jest.mock('./SiteImage', () => ({
  SiteImage: ({ src, alt, sizes, priority }: { src: string; alt: string; sizes: string; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} data-sizes={sizes} data-priority={String(priority ?? false)} />
  ),
}))

describe('Header', () => {
  it('renders the brand link with the site title from config, not a hardcoded name', () => {
    const { container } = render(<Header />)
    const brandLink = container.querySelector('.btn-ghost')
    expect(brandLink).toHaveTextContent(config.title)
    expect(brandLink).toHaveAttribute('href', '/')
  })

  it('labels the avatar with the site title', () => {
    render(<Header />)
    expect(screen.getByRole('img', { name: config.title })).toBeInTheDocument()
  })

  it('routes the avatar through the image pipeline rather than a raw img', () => {
    // Header is in the layout, so this image loads on every page on the site. Before
    // this it was a 600x600, 347 KB original in a 40x40 slot.
    render(<Header />)

    expect(screen.getByRole('img', { name: config.title })).toHaveAttribute('src', '/images/curtis.png')
    expect(screen.getByRole('img', { name: config.title })).toHaveAttribute('data-sizes', '40px')
  })

  it('declares the avatar as priority, since it is above the fold on every page', () => {
    render(<Header />)

    expect(screen.getByRole('img', { name: config.title })).toHaveAttribute('data-priority', 'true')
  })
})
