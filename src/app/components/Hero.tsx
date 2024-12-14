export const Hero = () => (
  <div
    className="hero"
    style={{
      background: 'no-repeat fixed 50% 100% / cover',
      backgroundImage: "url(/images/cover.jpg)",

    }}>
    <div className="hero-overlay bg-opacity-10"></div>
    <div className="hero-content text-neutral-content text-center py-20 text-white">
      <div className="max-w-md hero-text-container">
        <h1 className="mb-5 text-4xl font-bold">Curtis Timson</h1>
        <p className="mb-5 text-l description">
          software engineer
        </p>
      </div>
    </div>
  </div>
)