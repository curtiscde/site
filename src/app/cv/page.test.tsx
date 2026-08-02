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

  it('renders the banner at the compact height, not full height', () => {
    const { container } = render(<CvPage />)
    expect(container.querySelector('.hero--compact')).toBeInTheDocument()
    expect(container.querySelector('.hero-content')).toHaveClass('py-10')
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
