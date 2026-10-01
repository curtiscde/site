import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BannerSpotlight } from './BannerSpotlight'

// jsdom has no layout, so every box is stubbed: the row starts at x=100 and each chip
// gets its own span, which is what the spotlight's edges are measured from.
const box = (el: Element, left: number, right: number) => {
  el.getBoundingClientRect = () => ({ left, right } as DOMRect)
}

// Built by hand rather than with PointerEvent, which jsdom does not implement.
const pointer = (type: string, target: Element, init: { pointerType?: string; relatedTarget?: Element | null } = {}) => {
  const event = new Event(type, { bubbles: true })
  Object.defineProperties(event, {
    pointerType: { value: init.pointerType ?? 'mouse' },
    relatedTarget: { value: init.relatedTarget ?? null },
  })
  target.dispatchEvent(event)
}

const setup = () => {
  const { container, unmount } = render(
    <div className="hero">
      <BannerSpotlight />
      <div className="hero-row">
        <a className="hero-item" href="/a">a</a>
        <a className="hero-item" href="/b">b</a>
      </div>
      <div className="hero-row">
        <a className="hero-item" href="/c">c</a>
      </div>
    </div>,
  )
  const hero = container.querySelector<HTMLElement>('.hero')!
  const [row1, row2] = Array.from(container.querySelectorAll<HTMLElement>('.hero-row'))
  const [a, b, c] = Array.from(container.querySelectorAll<HTMLElement>('.hero-item'))
  box(row1, 100, 1100)
  box(row2, 100, 1100)
  box(a, 150, 400)
  box(b, 400, 480)
  box(c, 300, 350)
  return { hero, row1, row2, a, b, c, unmount }
}

describe('BannerSpotlight', () => {
  it('marks the banner as armed, so the CSS swaps the whole-row fallback for the mask', () => {
    const { hero } = setup()
    expect(hero.dataset.spotlight).toBe('')
  })

  it('writes the hovered chip edges relative to its row', () => {
    const { row1, a } = setup()
    pointer('pointerover', a)
    expect(row1).toHaveClass('is-spot')
    expect(row1.style.getPropertyValue('--spot-l')).toBe('50px')
    expect(row1.style.getPropertyValue('--spot-r')).toBe('300px')
  })

  it('moves to the next chip without switching off between them', () => {
    const { row1, a, b } = setup()
    pointer('pointerover', a)
    pointer('pointerout', a, { relatedTarget: b })
    pointer('pointerover', b)
    expect(row1).toHaveClass('is-spot')
    expect(row1.style.getPropertyValue('--spot-l')).toBe('300px')
    expect(row1.style.getPropertyValue('--spot-r')).toBe('380px')
  })

  it('switches off when the pointer leaves for another row', () => {
    const { row1, row2, a, c } = setup()
    pointer('pointerover', a)
    pointer('pointerout', a, { relatedTarget: c })
    pointer('pointerover', c)
    expect(row1).not.toHaveClass('is-spot')
    expect(row2).toHaveClass('is-spot')
  })

  it('switches off when the pointer leaves the banner', () => {
    const { row1, a } = setup()
    pointer('pointerover', a)
    pointer('pointerout', a, { relatedTarget: document.body })
    expect(row1).not.toHaveClass('is-spot')
  })

  it('ignores touch, which keeps the whole-row brighten', () => {
    const { row1, a } = setup()
    pointer('pointerover', a, { pointerType: 'touch' })
    expect(row1).not.toHaveClass('is-spot')
  })

  it('gives keyboard focus the same spotlight', () => {
    const { row1, b } = setup()
    b.focus()
    expect(row1).toHaveClass('is-spot')
    expect(row1.style.getPropertyValue('--spot-l')).toBe('300px')
    b.blur()
    expect(row1).not.toHaveClass('is-spot')
  })

  it('disarms and stops listening on unmount', () => {
    const { hero, row1, a, unmount } = setup()
    unmount()
    expect(hero.dataset.spotlight).toBeUndefined()
    pointer('pointerover', a)
    expect(row1).not.toHaveClass('is-spot')
  })
})
