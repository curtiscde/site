import { render, screen } from '@testing-library/react'
import PrivacyPolicy from './page'

jest.mock('../components/Header', () => ({
  Header: () => <header data-testid="header" />,
}))

describe('PrivacyPolicy', () => {
  it('renders the page heading', () => {
    render(<PrivacyPolicy />)
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument()
  })

  it('renders all section headings', () => {
    render(<PrivacyPolicy />)
    expect(screen.getByRole('heading', { level: 2, name: 'Who We Are' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'What Data We Collect and Why' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Legal Basis for Processing' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Data Retention' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Third-Party Data Processors' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Your Rights' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'How to Withdraw Consent or Manage Cookies' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Right to Complain' })).toBeInTheDocument()
  })

  it('renders the site URL link', () => {
    render(<PrivacyPolicy />)
    expect(screen.getByRole('link', { name: 'https://www.curtiscode.dev' })).toHaveAttribute('href', 'https://www.curtiscode.dev')
  })

  it('renders links to Google and ICO', () => {
    render(<PrivacyPolicy />)
    expect(screen.getByRole('link', { name: "Google's Privacy Policy" })).toHaveAttribute('href', 'https://policies.google.com/privacy')
    expect(screen.getByRole('link', { name: 'ico.org.uk' })).toHaveAttribute('href', 'https://ico.org.uk')
  })

  it('renders the Header', () => {
    render(<PrivacyPolicy />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })
})
