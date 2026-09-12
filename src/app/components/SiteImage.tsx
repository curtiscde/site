import React from "react"
import { resolveImage } from "../util/images"
import { PostImage } from "./PostImage"

export interface SiteImageProps {
  src: string
  alt: string
  /** The slot's CSS width, e.g. `40px`. These are fixed-size, so it is exact, not a guess. */
  sizes: string
  className?: string
  /** Above the fold on every page, in the header's case. */
  priority?: boolean
}

/**
 * Site chrome images — the avatar and the CV logo tiles — as responsive `<picture>`.
 *
 * Server-only: it reads the build-time manifest from disk. `Footer` is a client component
 * and so cannot use this; `layout.tsx` resolves its avatar and passes the variants down,
 * the same way listing pages pass `imageThumbnail` to `PostCard`.
 *
 * The SVG logos in `CompanyRow` have no manifest entry, so `PostImage` falls back to a
 * plain `<img>` of the original — no branch needed here.
 */
export const SiteImage = ({ src, alt, sizes, className, priority }: SiteImageProps) => (
  <PostImage
    src={src}
    alt={alt}
    sizes={sizes}
    variants={resolveImage(src)}
    className={className}
    priority={priority}
  />
)
