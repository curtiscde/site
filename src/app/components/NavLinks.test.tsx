import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NavLinks } from './NavLinks'

const mockUsePathname = jest.fn()
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

describe('NavLinks', () => {
  it('renders Blog and CV links with correct hrefs', () => {
    mockUsePathname.mockReturnValue('/')
    render(<NavLinks />)

    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'CV' })).toHaveAttribute('href', '/cv')
  })

  describe('active state', () => {
    it('marks Blog active on the home route', () => {
      mockUsePathname.mockReturnValue('/')
      render(<NavLinks />)

      expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: 'CV' })).not.toHaveAttribute('aria-current')
    })

    it('marks CV active on the /cv route', () => {
      mockUsePathname.mockReturnValue('/cv')
      render(<NavLinks />)

      expect(screen.getByRole('link', { name: 'CV' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: 'Blog' })).not.toHaveAttribute('aria-current')
    })

    it('applies the primary colour class to the active link', () => {
      mockUsePathname.mockReturnValue('/cv')
      render(<NavLinks />)

      expect(screen.getByRole('link', { name: 'CV' })).toHaveClass('text-primary')
      expect(screen.getByRole('link', { name: 'Blog' })).not.toHaveClass('text-primary')
    })

    it('does not mark Blog active on a non-home blog route', () => {
      mockUsePathname.mockReturnValue('/post/some-slug')
      render(<NavLinks />)

      expect(screen.getByRole('link', { name: 'Blog' })).not.toHaveAttribute('aria-current')
      expect(screen.getByRole('link', { name: 'CV' })).not.toHaveAttribute('aria-current')
    })
  })
})
