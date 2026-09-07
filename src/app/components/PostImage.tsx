import React from "react"
import { variantSrcSet, variantUrl } from "../util/images/urls"
import type { CoverImage } from "../types/Post"

export interface PostImageProps {
  src: string
  alt: string
  sizes: string
  /** Resolved at build time by `transformPost`; absent for GIFs, SVGs and unreadable files. */
  variants?: CoverImage
  className?: string
  priority?: boolean
}

/**
 * The React half of the image pipeline, matching the markup that `renderPicture` builds
 * as a string for in-article images.
 *
 * This is safe inside `'use client'` — it derives variant URLs from the widths carried on
 * the post rather than reading the build-time manifest, which `PostCard` cannot do.
 */
export const PostImage = ({ src, alt, sizes, variants, className, priority }: PostImageProps) => {
  const loading = priority ? "eager" : "lazy"

  // No variants: a GIF, an SVG, or a file sharp could not read. Serve the original rather
  // than pointing at files that were never generated.
  if (variants === undefined) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} loading={loading} decoding="async" />
    )
  }

  const { width, height, widths } = variants
  const widest = widths[widths.length - 1]

  return (
    <picture>
      <source type="image/avif" srcSet={variantSrcSet(src, widths, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={variantSrcSet(src, widths, "webp")} sizes={sizes} />
      <img
        src={variantUrl(src, widest, "webp")}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        decoding="async"
      />
    </picture>
  )
}
