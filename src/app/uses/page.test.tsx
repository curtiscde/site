import { render, screen } from '@testing-library/react'
import Uses from './page'

jest.mock('../components/Header', () => ({
  Header: () => <header data-testid="header" />,
}))

describe('Uses', () => {
  it('renders the page heading', () => {
    render(<Uses />)
    expect(screen.getByRole('heading', { level: 1, name: 'Uses' })).toBeInTheDocument()
  })

  it('renders a single h1 so the heading accent applies once', () => {
    const { container } = render(<Uses />)
    expect(container.querySelectorAll('h1')).toHaveLength(1)
  })

  it('renders the markdown section headings', () => {
    render(<Uses />)
    expect(screen.getByRole('heading', { level: 2, name: 'Hardware' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Development' })).toBeInTheDocument()
  })

  it('applies the content-page class that carries the heading accent', () => {
    const { container } = render(<Uses />)
    expect(container.querySelector('main')).toHaveClass('content-page')
  })

  it('renders the compact banner', () => {
    const { container } = render(<Uses />)
    expect(container.querySelector('.hero--compact')).toBeInTheDocument()
  })

  it('renders the Header', () => {
    render(<Uses />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })
})
