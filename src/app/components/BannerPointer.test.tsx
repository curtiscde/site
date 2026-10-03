import React from 'react'
import { render } from '@testing-library/react'
import { BannerPointer } from './BannerPointer'

// jsdom has no layout, so the banner's box is stubbed: 1000×200 at the origin, which puts
// its centre — the zero point of the parallax — at (500, 100).
const box = (el: Element) => {
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 200 } as DOMRect)
}

// Built by hand rather than with PointerEvent, which jsdom does not implement.
const move = (clientX: number, clientY: number) => {
  const event = new Event('pointermove')
  Object.defineProperties(event, { clientX: { value: clientX }, clientY: { value: clientY } })
  window.dispatchEvent(event)
}

const setup = () => {
  const { container, unmount } = render(
    <div className="hero">
      <BannerPointer />
      <div className="hero-parallax" />
      <a className="hero-item" href="/a">a</a>
    </div>,
  )
  const hero = container.querySelector<HTMLElement>('.hero')!
  const parallax = container.querySelector<HTMLElement>('.hero-parallax')!
  box(hero)
  return { hero, parallax, unmount }
}

describe('BannerPointer', () => {
  beforeEach(() => {
    // Run the coalesced write straight away instead of waiting for a frame.
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 1
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('writes the pointer offset onto the parallax wrapper', () => {
    const { parallax } = setup()
    move(750, 150)
    expect(parallax.style.getPropertyValue('--hero-mx')).toBe('0.500')
    expect(parallax.style.getPropertyValue('--hero-my')).toBe('0.500')
  })

  // The regression this guards: custom properties inherit, so a write on .hero made the
  // browser restyle every marquee anchor on every pointer frame.
  it('never writes onto .hero itself', () => {
    const { hero } = setup()
    move(750, 150)
    expect(hero.style.getPropertyValue('--hero-mx')).toBe('')
    expect(hero.style.getPropertyValue('--hero-my')).toBe('')
  })

  it('clamps a pointer far outside the banner to the edge of the range', () => {
    const { parallax } = setup()
    move(-5000, 9000)
    expect(parallax.style.getPropertyValue('--hero-mx')).toBe('-1.000')
    expect(parallax.style.getPropertyValue('--hero-my')).toBe('1.000')
  })

  it('does nothing under prefers-reduced-motion', () => {
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({ matches: query.includes('reduce') })) as typeof window.matchMedia
    try {
      const { parallax } = setup()
      move(750, 150)
      expect(parallax.style.getPropertyValue('--hero-mx')).toBe('')
    } finally {
      window.matchMedia = original
    }
  })

  it('stops listening once unmounted', () => {
    const { parallax, unmount } = setup()
    unmount()
    move(750, 150)
    expect(parallax.style.getPropertyValue('--hero-mx')).toBe('')
  })
})
