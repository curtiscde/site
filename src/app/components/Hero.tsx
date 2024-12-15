import { config } from "../config"

const { title, subtitle } = config

export const Hero = ({ tag }: { tag?: string }) => {
  const Content = () => {
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
          <Content />
        </div>
      </div>
    </div>
  )
}