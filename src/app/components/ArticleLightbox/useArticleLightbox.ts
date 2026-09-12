import { useCallback, useEffect, useRef, useState } from 'react'

export interface LightboxImage {
  /** The untouched original, from phase 2's `data-full`. Fetched only on open. */
  full: string
  /** The variant already decoded on the page, shown instantly while `full` loads. */
  preview: string
  alt: string
  /** The `<figcaption>` text, or '' when the markdown supplied no alt. */
  caption: string
}

/**
 * In-article images sit inside `dangerouslySetInnerHTML`, so there is no component per
 * image to hang a handler on. Everything here works by delegation on the article
 * container instead.
 */

/**
 * A linked image belongs to its link. `2017-moving-wordpress-hugo` wraps its xkcd image
 * in an anchor to xkcd.com; intercepting that click would break the author's intent.
 */
export function isEligible(img: HTMLImageElement): boolean {
  return img.closest('a') === null
}

export function collectImages(container: HTMLElement): HTMLImageElement[] {
  return Array.from(container.querySelectorAll('img')).filter(isEligible)
}

export function describeImage(img: HTMLImageElement): LightboxImage {
  const caption = img.closest('figure')?.querySelector('figcaption')?.textContent ?? ''
  // `||` rather than `??`: an <img> that has not resolved a source yet reports
  // currentSrc as '' rather than null, and a stripped data-full would be '' too.
  return {
    full: img.dataset.full || img.currentSrc || img.src,
    preview: img.currentSrc || img.src,
    alt: img.alt,
    caption,
  }
}

const AFFORDANCE = ['role', 'aria-label'] as const

export interface ArticleLightbox {
  images: LightboxImage[]
  index: number | null
  close: () => void
  next: () => void
  prev: () => void
}

export function useArticleLightbox(
  containerRef: React.RefObject<HTMLElement | null>
): ArticleLightbox {
  const [images, setImages] = useState<LightboxImage[]>([])
  const [index, setIndex] = useState<number | null>(null)
  // The element that opened the modal, so focus can go back to it on close.
  const trigger = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (container === null) return

    const found = collectImages(container)
    setImages(found.map(describeImage))

    // Applied from JavaScript, never in the server-rendered HTML: without this script
    // running there is no control here, so the article must not advertise one.
    for (const img of found) {
      img.tabIndex = 0
      img.setAttribute('role', 'button')
      img.setAttribute('aria-label', `View full size: ${img.alt || 'image'}`)
    }

    const openFrom = (target: EventTarget | null): boolean => {
      const img = (target as HTMLElement | null)?.closest('img') ?? null
      if (img === null || !container.contains(img)) return false
      if (!isEligible(img as HTMLImageElement)) return false
      const at = found.indexOf(img as HTMLImageElement)
      if (at === -1) return false
      trigger.current = img as HTMLImageElement
      setIndex(at)
      return true
    }

    const onClick = (event: MouseEvent) => {
      if (openFrom(event.target)) event.preventDefault()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      // Space scrolls the page by default, so only suppress it once we know we handled it.
      if (openFrom(event.target)) event.preventDefault()
    }

    container.addEventListener('click', onClick)
    container.addEventListener('keydown', onKeyDown)

    return () => {
      container.removeEventListener('click', onClick)
      container.removeEventListener('keydown', onKeyDown)
      for (const img of found) {
        img.removeAttribute('tabindex')
        for (const attribute of AFFORDANCE) img.removeAttribute(attribute)
      }
    }
  }, [containerRef])

  const close = useCallback(() => {
    setIndex(null)
    trigger.current?.focus()
  }, [])

  const step = useCallback(
    (by: number) =>
      setIndex((at) => (at === null || images.length === 0 ? at : (at + by + images.length) % images.length)),
    [images.length]
  )

  const next = useCallback(() => step(1), [step])
  const prev = useCallback(() => step(-1), [step])

  return { images, index, close, next, prev }
}
