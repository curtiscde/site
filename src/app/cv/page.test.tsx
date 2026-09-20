import { render, screen } from '@testing-library/react'
import CvPage from './page'

jest.mock('../components/Header', () => ({
  Header: () => <header data-testid="header" />,
}))

describe('CvPage', () => {
  it('renders the banner heading and subtitle', () => {
    render(<CvPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Curriculum Vitae' })).toBeInTheDocument()
    expect(screen.getByText('software engineer · london')).toBeInTheDocument()
  })

  // The banner's height is set by the variant class now rather than by padding
  // utilities on an inner element, so the class is the whole assertion.
  it('renders the banner at the compact height, not full height', () => {
    const { container } = render(<CvPage />)
    const hero = container.querySelector('.hero')
    expect(hero).toHaveClass('hero--compact')
    expect(hero).not.toHaveClass('hero--bare')
  })

  it('keeps the banner text, unlike the bare content-page banner', () => {
    const { container } = render(<CvPage />)
    expect(container.querySelector('.hero--bare')).toBeNull()
  })

  it('renders the experience section', () => {
    render(<CvPage />)
    expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeInTheDocument()
  })

  it('renders the LinkedIn link', () => {
    render(<CvPage />)
    expect(screen.getByRole('link', { name: /View on LinkedIn/ })).toBeInTheDocument()
  })
})
