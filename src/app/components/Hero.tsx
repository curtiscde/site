import { config } from "../config"
import { getBannerRows, type BannerRow, type BannerVariant } from "../util/banner"
import { BannerPointer } from "./BannerPointer"
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
const MarqueeRow = ({ row, activeTag }: { row: BannerRow; activeTag?: string }) => (
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
          <a
            key={item.href}
            className={
              activeTag != null && row.kind === 'tag' && item.label === activeTag
                ? 'hero-item hero-item--active'
                : 'hero-item'
            }
            href={item.href}
          >
            {item.label}
          </a>
        ))}
      </div>
      <div className="hero-run" aria-hidden="true">
        {row.items.map((item) => (
          <span className="hero-item" key={`dup-${item.href}`} tabIndex={-1}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  </div>
)

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
            <Content tag={tag} title={title} subtitle={subtitle} />
          </div>
        </div>
      )}
    </div>
  )
}
