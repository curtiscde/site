import { config } from "../config"
import { getBannerRows, type BannerItem, type BannerRow, type BannerVariant } from "../util/banner"
import { BannerPointer } from "./BannerPointer"
import { SiteImage } from "./SiteImage"
import "./Hero.scss"

const { title, subtitle } = config

/**
 * `compact` keeps the title/subtitle but shortens the banner.
 * `bare` drops the text entirely for a thin band carrying a single tag row.
 */
type HeroVariant = 'compact' | 'bare'

interface HeroProps {
  tag?: string
  title?: string
  subtitle?: string
  variant?: HeroVariant
  /** Injected by tests; production renders whatever `getBannerRows` returns. */
  rows?: BannerRow[]
}

/**
 * Shown only alongside the site's own name, not on tag or custom-title banners —
 * a face next to "🔖 javascript" reads as a byline for the tag.
 */
const Avatar = () => (
  <div className="hero-avatar">
    <SiteImage src="/images/curtis.png" alt={config.title} sizes="76px" priority />
  </div>
)

/**
 * Text only. The avatar is a sibling, not part of this, because `.hero-panel` is a flex
 * row — returning the heading and subtitle as direct panel children laid them out side
 * by side instead of stacked.
 */
const Content = ({ tag, title: titleProp, subtitle: subtitleProp }: HeroProps) => {
  if (titleProp != null) {
    return (
      <>
        <h1 className="hero-title">{titleProp}</h1>
        {subtitleProp != null && <p className="hero-subtitle">{subtitleProp}</p>}
      </>
    )
  }

  if (tag != null) {
    return <h1 className="hero-title">🔖 {tag}</h1>
  }

  return (
    <>
      <h1 className="hero-title">{title}</h1>
      <p className="hero-subtitle">{subtitle}</p>
    </>
  )
}

/**
 * The colour field: two band layers crossing at different angles and periods, plus a
 * scrim and grain.
 *
 * Two layers rather than one because a single layer translating is a rigid block
 * sliding sideways, which the eye reads as static however far it travels. Their
 * relative motion is what actually changes the colours.
 */
const Field = () => (
  <div className="hero-field" aria-hidden="true">
    <div className="hero-parallax">
      <div className="hero-bands hero-bands--main" />
      <div className="hero-bands hero-bands--cross" />
    </div>
    <span className="hero-scrim" />
    <span className="hero-grain" />
  </div>
)

/**
 * One marquee row. The track renders twice so `translateX(-50%)` loops seamlessly;
 * the duplicate is plain text, hidden from assistive tech and out of the tab order,
 * so the anchors are never duplicated.
 */
const MarqueeRow = ({ row, activeTag }: { row: BannerRow; activeTag?: string }) => {
  // Shared by both runs: the highlight has to survive the duplicate half of the cycle
  // too, or the browsed tag blinks out every time the track wraps.
  const itemClass = (item: BannerItem) =>
    activeTag != null && row.kind === 'tag' && item.label === activeTag
      ? 'hero-item hero-item--active'
      : 'hero-item'

  return (
  <div
    className={`hero-row hero-row--${row.kind} hero-row--${row.direction}`}
    style={
      {
        '--hero-row-opacity': row.opacity,
        '--hero-row-duration': `${row.durationSeconds}s`,
      } as React.CSSProperties
    }
  >
    <div className="hero-track">
      <div className="hero-run">
        {row.items.map((item) => (
          <a key={item.href} className={itemClass(item)} href={item.href}>
            {item.label}
          </a>
        ))}
      </div>
      {/*
        The duplicate must be anchors too, not spans. The track scrolls to -50%, so for
        roughly half of every cycle what you are looking at IS the duplicate — rendering
        it as text made half the marquee silently unclickable, and the faster tag rows
        reached that dead half almost twice as quickly as the title rows.
        aria-hidden + tabindex="-1" keep it out of the a11y tree and the tab order; the
        repeated hrefs are the same page's own links, which is harmless.
      */}
      <div className="hero-run" aria-hidden="true">
        {row.items.map((item) => (
          <a key={`dup-${item.href}`} className={itemClass(item)} href={item.href} tabIndex={-1}>
            {item.label}
          </a>
        ))}
      </div>
    </div>
  </div>
  )
}

export const Hero = ({ tag, title, subtitle, variant, rows }: HeroProps) => {
  const isBare = variant === 'bare'
  const bannerVariant: BannerVariant = variant ?? 'full'
  const bannerRows = rows ?? getBannerRows(bannerVariant)

  return (
    <div className={variant != null ? `hero hero--${variant}` : "hero"}>
      <BannerPointer />
      <Field />
      <div className="hero-rows">
        {bannerRows.map((row, index) => (
          <MarqueeRow key={index} row={row} activeTag={tag} />
        ))}
      </div>
      {!isBare && (
        <div className="hero-centre">
          <div className="hero-panel">
            {/* Only beside the site's own name — a face next to "🔖 javascript" or
                "Curriculum Vitae" reads as a byline for that page's subject. */}
            {tag == null && title == null && <Avatar />}
            <div className="hero-text">
              <Content tag={tag} title={title} subtitle={subtitle} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
