'use client'

/**
 * Spotlights the hovered or focused marquee chip: the chip sits at full strength and the
 * rest of its row eases back to the row's resting opacity. Renders nothing — it writes
 * the chip's edges onto the row as custom properties and Hero.scss draws the falloff.
 *
 * Anchored to the chip, not the pointer. Title chips run to ~500px, so a falloff centred
 * on the cursor dimmed half the chip being hovered. Reading the chip's box also means
 * keyboard focus gets the identical effect from the same code.
 *
 * Deliberately not gated on prefers-reduced-motion, unlike BannerPointer: brightening is
 * not motion, and with the marquee stilled it is the most useful cue the banner has.
 * The CSS drops the transition instead.
 *
 * Until this mounts, `data-spotlight` is absent and the CSS keeps the whole-row
 * brighten. Touch keeps it too, since a tap is ignored below.
 */

import { useEffect } from 'react'

export function BannerSpotlight() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.hero')
    if (hero == null) return

    const rowOf = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('.hero-row') : null

    const spot = (target: EventTarget | null) => {
      const item = target instanceof Element ? target.closest<HTMLElement>('.hero-item') : null
      const row = rowOf(item)
      if (item == null || row == null) return
      // Measured once on entry. Hover and focus both pause the row, so the chip holds
      // still for as long as the spotlight is on it.
      const left = row.getBoundingClientRect().left
      const chip = item.getBoundingClientRect()
      row.style.setProperty('--spot-l', `${chip.left - left}px`)
      row.style.setProperty('--spot-r', `${chip.right - left}px`)
      if (!row.classList.contains('is-spot')) {
        // Edges only transition on a lit row. Flushing style here lands them before the
        // class goes on, so a row lighting up starts on its chip rather than sweeping in
        // from wherever the edges were last left.
        void getComputedStyle(row).getPropertyValue('--spot-l')
      }
      row.classList.add('is-spot')
    }

    // Only once the pointer or focus has left the row altogether: moving chip to chip
    // inside it should slide the spotlight across, not blink it off and on.
    const unspot = (from: EventTarget | null, to: EventTarget | null) => {
      const row = rowOf(from)
      if (row != null && rowOf(to) !== row) row.classList.remove('is-spot')
    }

    // A tap fires pointerover too, but on touch it is the start of a navigation, not a
    // hover — spotlighting it would only flash the row on the way to the next page.
    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') spot(event.target)
    }
    const onOut = (event: PointerEvent) => unspot(event.target, event.relatedTarget)
    const onFocusIn = (event: FocusEvent) => spot(event.target)
    const onFocusOut = (event: FocusEvent) => unspot(event.target, event.relatedTarget)

    hero.addEventListener('pointerover', onOver)
    hero.addEventListener('pointerout', onOut)
    hero.addEventListener('focusin', onFocusIn)
    hero.addEventListener('focusout', onFocusOut)
    hero.dataset.spotlight = ''

    return () => {
      hero.removeEventListener('pointerover', onOver)
      hero.removeEventListener('pointerout', onOut)
      hero.removeEventListener('focusin', onFocusIn)
      hero.removeEventListener('focusout', onFocusOut)
      delete hero.dataset.spotlight
    }
  }, [])

  return null
}
