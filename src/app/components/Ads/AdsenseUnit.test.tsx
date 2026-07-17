import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdsenseScript, AdsenseUnit } from './AdsenseUnit'

jest.mock('../../context/ConsentContext', () => ({
  useConsent: jest.fn(),
}))

jest.mock('next/script', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    <div data-testid="next-script" data-src={props.src as string} />
  ),
}))

import { useConsent } from '../../context/ConsentContext'
const mockUseConsent = useConsent as jest.Mock

describe('AdsenseScript', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when consent is not granted', () => {
    mockUseConsent.mockReturnValue({ consent: 'undecided' })
    const { container } = render(<AdsenseScript />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when consent is denied', () => {
    mockUseConsent.mockReturnValue({ consent: 'denied' })
    const { container } = render(<AdsenseScript />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the adsbygoogle script when consent is granted', () => {
    mockUseConsent.mockReturnValue({ consent: 'granted' })
    const { container } = render(<AdsenseScript />)
    const script = container.querySelector('[data-testid="next-script"]')
    expect(script).not.toBeNull()
    expect(script).toHaveAttribute(
      'data-src',
      expect.stringContaining('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-')
    )
  })
})

describe('AdsenseUnit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).adsbygoogle
  })

  it('renders nothing when consent is not granted', () => {
    mockUseConsent.mockReturnValue({ consent: 'undecided' })
    const { container } = render(<AdsenseUnit adSlot="1234" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when consent is denied', () => {
    mockUseConsent.mockReturnValue({ consent: 'denied' })
    const { container } = render(<AdsenseUnit adSlot="1234" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the ad unit with the given slot when consent is granted', () => {
    mockUseConsent.mockReturnValue({ consent: 'granted' })
    const { container } = render(<AdsenseUnit adSlot="1234" />)
    const ins = container.querySelector('ins.adsbygoogle')
    expect(ins).toBeInTheDocument()
    expect(ins).toHaveAttribute('data-ad-slot', '1234')
    expect(ins).toHaveAttribute('data-ad-client', expect.stringContaining('ca-'))
  })

  it('pushes to window.adsbygoogle when consent is granted', () => {
    mockUseConsent.mockReturnValue({ consent: 'granted' })
    render(<AdsenseUnit adSlot="1234" />)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).adsbygoogle).toHaveLength(1)
  })

  it('does not push to window.adsbygoogle when consent is not granted', () => {
    mockUseConsent.mockReturnValue({ consent: 'undecided' })
    render(<AdsenseUnit adSlot="1234" />)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).adsbygoogle).toBeUndefined()
  })

  it('only pushes to window.adsbygoogle once across re-renders', () => {
    mockUseConsent.mockReturnValue({ consent: 'granted' })
    const { rerender } = render(<AdsenseUnit adSlot="1234" />)
    rerender(<AdsenseUnit adSlot="1234" />)
    rerender(<AdsenseUnit adSlot="1234" />)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).adsbygoogle).toHaveLength(1)
  })
})
