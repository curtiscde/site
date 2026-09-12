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

  it('serves a variant of the avatar, never the 347 KB original', () => {
    // Header is in the layout, so this image loads on every page on the site.
    const { container } = render(<Header />)

    expect(container.innerHTML).not.toContain('src="/images/curtis.png"')
  })

  it('loads the avatar eagerly, since it is above the fold on every page', () => {
    render(<Header />)

    expect(screen.getByRole('img', { name: config.title })).toHaveAttribute('loading', 'eager')
  })
})
