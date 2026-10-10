import { useEffect } from 'react'
import Panzoom from '@panzoom/panzoom'

/** Where a double-tap lands, and the least any image may be zoomed to. */
export const DOUBLE_TAP_SCALE = 2.5
const DOUBLE_TAP_MS = 300
/** How far a finger may drift and still count as a tap rather than a drag. */
const TAP_SLOP = 10
/** How far apart the two taps of a double-tap may land. */
const DOUBLE_TAP_DISTANCE = 30

export interface Tap {
  time: number
  x: number
  y: number
}

/**
 * How far an image may be zoomed: until one pixel of the original fills one CSS pixel,
 * so a downsized screenshot can be enlarged until its text is crisp — but never less
 * than {@link DOUBLE_TAP_SCALE}, so a small image still zooms far enough to be useful.
 */
export function maxScaleFor(img: HTMLImageElement): number {
  const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img
  if (!naturalWidth || !naturalHeight || !clientWidth || !clientHeight) return DOUBLE_TAP_SCALE
  // On phones the image is `object-fit: contain` inside a full-screen box, so the
  // picture actually painted is the letterboxed fit, not the element's own box.
  const shownWidth = Math.min(clientWidth, (clientHeight * naturalWidth) / naturalHeight)
  return Math.max(DOUBLE_TAP_SCALE, naturalWidth / shownWidth)
}

export function isDoubleTap(previous: Tap | null, tap: Tap): boolean {
  return (
    previous !== null &&
    tap.time - previous.time <= DOUBLE_TAP_MS &&
    Math.hypot(tap.x - previous.x, tap.y - previous.y) <= DOUBLE_TAP_DISTANCE
  )
}

/**
 * Pinch-zoom, pan and double-tap on the lightbox image.
 *
 * The modal is fixed and the page behind it is inert, so the browser's own pinch-zoom
 * scales the whole viewport rather than the picture. The image therefore claims touch
 * for itself (`touch-action: none`, set by Panzoom) and zooms within its own box.
 *
 * Re-created for each image, so moving through the gallery starts every image unzoomed.
 * Mouse-wheel zoom is never bound, and double-tap answers to touch only, so the
 * desktop modal behaves exactly as before.
 */
export function useLightboxZoom(
  imageRef: React.RefObject<HTMLImageElement | null>,
  /** The image being shown. A new value tears down the old zoom and starts afresh. */
  image: unknown
): void {
  useEffect(() => {
    const img = imageRef.current
    if (img === null || image === undefined) return

    const panzoom = Panzoom(img, {
      // The stage wraps the image exactly, so 'outside' keeps a zoomed image covering
      // it — no panning off into empty space — and pins it in place when unzoomed.
      contain: 'outside',
      panOnlyWhenZoomed: true,
      maxScale: maxScaleFor(img),
      // Panzoom would otherwise set `cursor: move` even while panning is disabled.
      cursor: '',
      // Its default also stops propagation, which would hide the pointer from the
      // double-tap listener below.
      handleStartEvent: (event) => event.preventDefault(),
    })

    // The preview is swapped for the original once it decodes, and the window may be
    // rotated; either changes how far the image can usefully go.
    const updateMaxScale = () => panzoom.setOptions({ maxScale: maxScaleFor(img) })

    let down: Tap | null = null
    let pointers = 0
    let multiTouch = false
    let lastTap: Tap | null = null

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      pointers += 1
      if (pointers > 1) multiTouch = true
      down = { time: event.timeStamp, x: event.clientX, y: event.clientY }
    }

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      pointers = Math.max(0, pointers - 1)
      const start = down
      const wasPinch = multiTouch
      if (pointers === 0) multiTouch = false
      // A finger lifting at the end of a pinch, or the end of a drag, is not a tap.
      if (wasPinch || start === null) return
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP) return

      const tap = { time: event.timeStamp, x: event.clientX, y: event.clientY }
      if (!isDoubleTap(lastTap, tap)) {
        lastTap = tap
        return
      }
      lastTap = null
      if (panzoom.getScale() > 1) {
        panzoom.reset()
      } else {
        updateMaxScale()
        panzoom.zoomToPoint(DOUBLE_TAP_SCALE, { clientX: tap.x, clientY: tap.y }, { animate: true })
      }
    }

    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      pointers = Math.max(0, pointers - 1)
      if (pointers === 0) multiTouch = false
      down = null
    }

    img.addEventListener('load', updateMaxScale)
    img.addEventListener('panzoomstart', updateMaxScale)
    img.addEventListener('pointerdown', onPointerDown)
    img.addEventListener('pointerup', onPointerUp)
    img.addEventListener('pointercancel', onPointerCancel)

    return () => {
      img.removeEventListener('load', updateMaxScale)
      img.removeEventListener('panzoomstart', updateMaxScale)
      img.removeEventListener('pointerdown', onPointerDown)
      img.removeEventListener('pointerup', onPointerUp)
      img.removeEventListener('pointercancel', onPointerCancel)
      panzoom.destroy()
      panzoom.resetStyle()
      // The <img> element is reused for the next image, so it must not inherit a zoom.
      img.style.transform = ''
    }
  }, [imageRef, image])
}
