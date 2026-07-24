import { config } from "../config"
import "./Hero.scss"

const { title, subtitle } = config

interface HeroProps {
  tag?: string
  title?: string
  subtitle?: string
}

const Content = ({ tag, title: titleProp, subtitle: subtitleProp }: HeroProps) => {
  if (titleProp != null) {
    return (
      <>
        <h1 className="mb-5 text-4xl font-bold">{titleProp}</h1>
        {subtitleProp != null && (
          <p className="mb-5 text-l description">
            {subtitleProp}
          </p>
        )}
      </>
    )
  }

  if (tag != null) {
    return (
      <h1 className="mb-5 text-4xl font-bold">🔖 {tag}</h1>
    )
  }

  return (
    <>
      <h1 className="mb-5 text-4xl font-bold">{title}</h1>
      <p className="mb-5 text-l description">
        {subtitle}
      </p>
    </>
  )
}

export const Hero = ({ tag, title, subtitle }: HeroProps) => {
  return (
    <div
      className="hero"
      style={{
        background: 'no-repeat fixed 50% 100% / cover',
        backgroundImage: "url(/images/cover.jpg)",

      }}>
      <div className="hero-overlay bg-opacity-10"></div>
      <div className="hero-content text-neutral-content text-center py-20 text-white">
        <div className="max-w-md hero-text-container">
          <Content tag={tag} title={title} subtitle={subtitle} />
        </div>
      </div>
    </div>
  )
}