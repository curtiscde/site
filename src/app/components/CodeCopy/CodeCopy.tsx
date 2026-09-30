'use client'

import React from 'react'
import { useCodeCopy } from './useCodeCopy'
import './CodeCopy.scss'

/**
 * Copy-to-clipboard for in-article code blocks.
 *
 * The buttons themselves are emitted at build time by the `code` renderer in
 * types/Post.ts. This component only brings them to life, and renders the one live
 * region that announces the result for every block on the page.
 */
export const CodeCopy = ({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>
}) => {
  const message = useCodeCopy(containerRef)

  return (
    <p className="sr-only" aria-live="polite">
      {message}
    </p>
  )
}
