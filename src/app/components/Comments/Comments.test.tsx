import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Comments } from './Comments'
import { ThemeContext } from '../../context/ThemeContext'
import { config } from '../../config'

const mockGrantConsent = jest.fn()
const mockDenyConsent = jest.fn()

jest.mock('../../context/ConsentContext', () => ({
  useConsent: jest.fn(),
}))

jest.mock('@giscus/react', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="giscus-mock" />),
}))

import { useConsent } from '../../context/ConsentContext'
import Giscus from '@giscus/react'
const mockUseConsent = useConsent as jest.Mock
const mockGiscus = Giscus as jest.Mock

const renderWithTheme = (theme: string) =>
  render(
    <ThemeContext.Provider value={{ theme, changeTheme: jest.fn() }}>
      <Comments />
    </ThemeContext.Provider>
  )

describe('Comments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when consent has not been granted', () => {
    it.each(['undecided', 'denied'])('renders a prompt to accept cookies when consent is %s', (consent) => {
      mockUseConsent.mockReturnValue({ consent, grantConsent: mockGrantConsent, denyConsent: mockDenyConsent })
      renderWithTheme('light')
      expect(screen.getByText('Accept cookies to load comments.')).toBeInTheDocument()
      expect(mockGiscus).not.toHaveBeenCalled()
    })
  })

  describe('when consent is granted', () => {
    beforeEach(() => {
      mockUseConsent.mockReturnValue({ consent: 'granted', grantConsent: mockGrantConsent, denyConsent: mockDenyConsent })
    })

    it('does not render the cookie prompt', () => {
      renderWithTheme('light')
      expect(screen.queryByText('Accept cookies to load comments.')).toBeNull()
    })

    it('renders Giscus with theme="dark" when the theme is dark', () => {
      renderWithTheme('dark')
      expect(mockGiscus.mock.calls[0][0]).toEqual(expect.objectContaining({ theme: 'dark' }))
    })

    it('renders Giscus with theme="light" when the theme is light', () => {
      renderWithTheme('light')
      expect(mockGiscus.mock.calls[0][0]).toEqual(expect.objectContaining({ theme: 'light' }))
    })

    it('renders Giscus with theme="light" for any non-dark theme value', () => {
      renderWithTheme('sepia')
      expect(mockGiscus.mock.calls[0][0]).toEqual(expect.objectContaining({ theme: 'light' }))
    })

    it('passes the configured giscus repo settings to Giscus', () => {
      renderWithTheme('light')
      expect(mockGiscus.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          repo: config.giscus.repo,
          repoId: config.giscus.repoId,
          category: config.giscus.category,
          categoryId: config.giscus.categoryId,
        })
      )
    })
  })
})
