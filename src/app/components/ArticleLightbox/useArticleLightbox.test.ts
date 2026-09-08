import { collectImages, describeImage, isEligible } from './useArticleLightbox'

/** An <img>'s `src` property resolves against the document, unlike its attribute. */
const resolved = (path: string) => new URL(path, document.baseURI).href

const container = (html: string): HTMLElement => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div
}

const figure = (attrs: string, caption = '') =>
  `<figure><picture><img ${attrs}></picture>${caption === '' ? '' : `<figcaption aria-hidden="true">${caption}</figcaption>`}</figure>`

describe('isEligible', () => {
  it('accepts a plain in-article image', () => {
    const div = container(figure('src="/_img/a-800.webp" alt="A">'))

    expect(isEligible(div.querySelector('img')!)).toBe(true)
  })

  it('rejects an image wrapped in a link', () => {
    // 2017-moving-wordpress-hugo links its xkcd image out to xkcd.com. Opening a modal
    // there would swallow the click and break the author's intent.
    const div = container(`<a href="https://xkcd.com/327/">${figure('src="/x.webp" alt="X">')}</a>`)

    expect(isEligible(div.querySelector('img')!)).toBe(false)
  })
})

describe('collectImages', () => {
  it('returns article images in document order and drops linked ones', () => {
    const div = container(
      figure('src="/one.webp" alt="One">') +
        `<a href="https://example.com">${figure('src="/two.webp" alt="Two">')}</a>` +
        figure('src="/three.webp" alt="Three">')
    )

    expect(collectImages(div).map((img) => img.alt)).toEqual(['One', 'Three'])
  })

  it('is empty for an article with no images', () => {
    expect(collectImages(container('<p>Just prose.</p>'))).toEqual([])
  })
})

describe('describeImage', () => {
  it('prefers data-full, so the modal shows the untouched original', () => {
    const div = container(
      figure('src="/_img/post/x/shot-800.webp" data-full="/post/x/shot.png" alt="Shot">')
    )

    const described = describeImage(div.querySelector('img')!)

    // `dataset.full` is the raw attribute; `src` resolves against the document, which is
    // what the browser does too. Both are valid <img> sources.
    expect(described.full).toBe('/post/x/shot.png')
    expect(described.preview).toBe(resolved('/_img/post/x/shot-800.webp'))
  })

  it('falls back to the displayed source when there is no data-full', () => {
    // A GIF, an SVG, or a lightbox shipped before phase 2 — the modal then shows the
    // file already on screen rather than pointing at something that does not exist.
    const div = container(figure('src="/post/x/animation.gif" alt="Animation">'))

    const described = describeImage(div.querySelector('img')!)

    expect(described.full).toBe(resolved('/post/x/animation.gif'))
    expect(described.preview).toBe(described.full)
  })

  it('carries the caption through from the figure', () => {
    const div = container(figure('src="/a.webp" alt="Alt text">', 'A visible caption'))

    expect(describeImage(div.querySelector('img')!).caption).toBe('A visible caption')
  })

  it('reports an empty caption when the markdown supplied no alt', () => {
    const div = container(figure('src="/a.webp" alt="">'))

    expect(describeImage(div.querySelector('img')!).caption).toBe('')
  })
})
