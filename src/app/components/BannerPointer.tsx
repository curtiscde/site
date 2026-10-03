'use client'

/**
 * Drives the colour field's parallax. Renders nothing: it attaches one passive
 * pointermove listener and writes two custom properties, so the banner markup stays
 * server-rendered and the CSS does the work.
 *
 * Touch: pointermove only fires during a drag, so on a phone the field responds while
 * scrolling with a finger down and is otherwise still. There is no touch equivalent of
 * hover, and device orientation needs a permission prompt on iOS.
 */

import { useEffect } from 'react'

export function BannerPointer() {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.hero')
    // The properties go on the parallax wrapper, not on .hero. Custom properties inherit,
    // so writing them on .hero invalidated the style of every element in the banner —
    // ~400 marquee anchors — on every pointer frame, anywhere on the page. That measured
    // ~1.2ms per write unthrottled against ~0.06ms here; the wrapper has three children.
    const target = el?.querySelector<HTMLElement>('.hero-parallax')
    if (el == null || target == null) return
    // matchMedia is absent in jsdom and in older browsers. Treat that as "no stated
    // preference" rather than crashing the effect — the CSS still honours the query.
    if (typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let x = 0
    let y = 0

    const apply = () => {
      frame = 0
      target.style.setProperty('--hero-mx', x.toFixed(3))
      target.style.setProperty('--hero-my', y.toFixed(3))
    }

    // Clamped because the listener is on the window, not the banner: a pointer further
    // down a long page produces values well outside -1..1, which would shove the field
    // off screen entirely.
    const clamp = (n: number) => (n < -1 ? -1 : n > 1 ? 1 : n)

    // Window rather than the banner, so the field keeps responding while the pointer is
    // over the post cards — which is most of the page.
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      x = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2)
      y = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2)
      // Coalesce to one write per frame; pointermove fires far more often than that.
      if (frame === 0) frame = requestAnimationFrame(apply)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame !== 0) cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
