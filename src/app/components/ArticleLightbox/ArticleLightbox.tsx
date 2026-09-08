'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useArticleLightbox } from './useArticleLightbox'
import './ArticleLightbox.scss'

/**
 * Click-to-enlarge for in-article images, serving the untouched original.
 *
 * This is what makes phase 2's downsizing safe rather than lossy: most in-article images
 * are screenshots of code and UIs where detail is the point, so the reader needs a way
 * back to full resolution — but only pays for it on click.
 *
 * Native <dialog> supplies Escape-to-close, focus trapping and background inertness, so
 * no lightbox dependency is needed. Matches the modal pattern in Footer.tsx.
 */
export const ArticleLightbox = ({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>
}) => {
  const { images, index, close, next, prev } = useArticleLightbox(containerRef)
  const dialog = useRef<HTMLDialogElement>(null)
  // The original that has finished decoding, rather than a boolean: comparing it against
  // the current image makes moving through the gallery reset the placeholder for free.
  const [decoded, setDecoded] = useState<string | null>(null)

  const current = index === null ? undefined : images[index]
  const showFull = current !== undefined && decoded === current.full

  useEffect(() => {
    const element = dialog.current
    if (element === null) return
    if (index === null) {
      if (element.open) element.close()
    } else if (!element.open) {
      element.showModal()
    }
  }, [index])

  // The original is requested here — on open, never on page load. That is the bargain
  // that lets the article ship variants a fraction of the size.
  useEffect(() => {
    // Nothing to fetch when the image on the page is already the original — a GIF, or an
    // article that predates the variant pipeline.
    if (current === undefined || current.full === current.preview) return

    let cancelled = false
    const preload = new Image()
    // `load` fires asynchronously even from cache, so the placeholder is never skipped
    // over synchronously and a failed original simply leaves the preview in place.
    preload.onload = () => {
      if (!cancelled) setDecoded(current.full)
    }
    preload.src = current.full

    return () => {
      cancelled = true
      preload.onload = null
    }
  }, [current])

  const onKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (images.length < 2) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      next()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      prev()
    }
  }

  return (
    <dialog
      className="modal article-lightbox"
      ref={dialog}
      onClose={close}
      onKeyDown={onKeyDown}
      aria-label={current === undefined ? 'Image viewer' : `Full size: ${current.alt || 'image'}`}
    >
      <div className="modal-box article-lightbox__box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close">
            ✕
          </button>
        </form>

        {current !== undefined && (
          <figure className="article-lightbox__figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="article-lightbox__image"
              src={showFull ? current.full : current.preview}
              alt={current.alt}
            />
            {current.caption !== '' && (
              <figcaption className="article-lightbox__caption">{current.caption}</figcaption>
            )}
          </figure>
        )}

        {images.length > 1 && (
          <div className="article-lightbox__controls">
            <button className="btn btn-sm btn-circle" onClick={prev} aria-label="Previous image">
              ‹
            </button>
            <span className="article-lightbox__count">
              {(index ?? 0) + 1} / {images.length}
            </span>
            <button className="btn btn-sm btn-circle" onClick={next} aria-label="Next image">
              ›
            </button>
          </div>
        )}
      </div>

      {/* DaisyUI's backdrop: a full-bleed submit button that closes the dialog. */}
      <form method="dialog" className="modal-backdrop">
        <button aria-label="Close image viewer">close</button>
      </form>
    </dialog>
  )
}
