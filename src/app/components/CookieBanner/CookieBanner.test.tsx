import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CookieBanner } from './CookieBanner'

const mockGrantConsent = jest.fn()
const mockDenyConsent = jest.fn()

jest.mock('../../context/ConsentContext', () => ({
  useConsent: jest.fn(),
}))

import { useConsent } from '../../context/ConsentContext'
const mockUseConsent = useConsent as jest.Mock

describe('CookieBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when consent is undecided', () => {
    beforeEach(() => {
      mockUseConsent.mockReturnValue({
        consent: 'undecided',
        grantConsent: mockGrantConsent,
        denyConsent: mockDenyConsent,
      })
    })

    it('renders the banner', () => {
      render(<CookieBanner />)
      expect(screen.getByText(/we use cookies/i)).toBeInTheDocument()
    })

    it('renders the Privacy Policy link', () => {
      render(<CookieBanner />)
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy-policy')
    })

    it('calls grantConsent when Accept is clicked', () => {
      render(<CookieBanner />)
      fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
      expect(mockGrantConsent).toHaveBeenCalledTimes(1)
    })

    it('calls denyConsent when Decline is clicked', () => {
      render(<CookieBanner />)
      fireEvent.click(screen.getByRole('button', { name: 'Decline' }))
      expect(mockDenyConsent).toHaveBeenCalledTimes(1)
    })
  })

  describe('when consent is granted', () => {
    it('does not render the banner', () => {
      mockUseConsent.mockReturnValue({ consent: 'granted', grantConsent: jest.fn(), denyConsent: jest.fn() })
      render(<CookieBanner />)
      expect(screen.queryByText(/we use cookies/i)).toBeNull()
    })
  })

  describe('when consent is denied', () => {
    it('does not render the banner', () => {
      mockUseConsent.mockReturnValue({ consent: 'denied', grantConsent: jest.fn(), denyConsent: jest.fn() })
      render(<CookieBanner />)
      expect(screen.queryByText(/we use cookies/i)).toBeNull()
    })
  })
})
