import { useEffect, useRef, useState } from 'react'
import { useConsent } from '../../context/ConsentContext'

declare global {
  interface Window {
    /** Defined by the GA4 snippet in GoogleAnalytics.tsx, which only loads after consent. */
    gtag?: (...args: unknown[]) => void
  }
}

/** How long the tick (or failure state) shows before the button returns to idle. */
export const RESET_MS = 2000

export type CopyState = 'idle' | 'copied' | 'failed'

const MESSAGES: Record<CopyState, string> = {
  idle: '',
  copied: 'Copied',
  failed: "Couldn't copy",
}

/**
 * Code blocks arrive through `dangerouslySetInnerHTML`, so there is no component per
 * block to hang a handler on. One listener on the article handles every button, the
 * same way the lightbox handles images.
 *
 * Selects by the `code-block` classes only. The bundle check treats the highlight.js
 * class name appearing in client code as highlight.js leaking into the browser.
 *
 * Returns the message for the page's single live region.
 */
export function useCodeCopy(containerRef: React.RefObject<HTMLElement | null>): string {
  const [message, setMessage] = useState('')
  const { consent } = useConsent()
  // Read at click time rather than captured by the effect, so accepting the cookie
  // banner after the page loads counts the next copy without re-binding the listener.
  const consentRef = useRef(consent)
  useEffect(() => {
    consentRef.current = consent
  }, [consent])

  useEffect(() => {
    const container = containerRef.current
    // Without the clipboard API the button could do nothing, so it stays hidden.
    if (container === null || typeof navigator.clipboard?.writeText !== 'function') return

    const found = Array.from(container.querySelectorAll<HTMLButtonElement>('.code-block__copy'))
    for (const button of found) {
      button.dataset.state = 'idle'
      button.hidden = false
    }

    const timers = new Map<HTMLButtonElement, ReturnType<typeof setTimeout>>()

    const show = (button: HTMLButtonElement, state: CopyState) => {
      button.dataset.state = state
      setMessage(MESSAGES[state])
      clearTimeout(timers.get(button))
      timers.set(button, setTimeout(() => {
        button.dataset.state = 'idle'
        timers.delete(button)
        // Only clear the announcement if no other block has spoken since.
        if (timers.size === 0) setMessage('')
      }, RESET_MS))
    }

    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest<HTMLButtonElement>('.code-block__copy')
      if (button == null || !found.includes(button)) return
      // textContent of the highlighted <code> is the original source: highlight.js only
      // wraps tokens in spans and escapes entities, both of which textContent undoes.
      const block = button.closest<HTMLElement>('.code-block')
      const code = block?.querySelector('pre > code')
      navigator.clipboard.writeText(code?.textContent ?? '').then(
        () => {
          show(button, 'copied')
          // gtag outliving a withdrawn consent is why this checks consent, not just
          // whether GA is on the page.
          if (consentRef.current === 'granted') {
            window.gtag?.('event', 'copy_code', {
              language: block?.dataset.language ?? 'none',
              block_index: found.indexOf(button),
            })
          }
        },
        () => show(button, 'failed'),
      )
    }

    container.addEventListener('click', onClick)
    return () => {
      container.removeEventListener('click', onClick)
      timers.forEach(clearTimeout)
      for (const button of found) {
        button.hidden = true
        delete button.dataset.state
      }
    }
  }, [containerRef])

  return message
}
