import React, { useRef } from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ArticleLightbox } from './ArticleLightbox'

const figure = (src: string, alt: string, full?: string, caption?: string) =>
  `<figure><picture><img src="${src}" alt="${alt}"${full === undefined ? '' : ` data-full="${full}"`}></picture>` +
  `${caption === undefined ? '' : `<figcaption aria-hidden="true">${caption}</figcaption>`}</figure>`

const Article = ({ html }: { html: string }) => {
  const container = useRef<HTMLDivElement>(null)
  return (
    <>
      <div ref={container} dangerouslySetInnerHTML={{ __html: html }} />
      <ArticleLightbox containerRef={container} />
    </>
  )
}

const gallery =
  figure('/_img/one-800.webp', 'One', '/one.png', 'First caption') +
  figure('/_img/two-800.webp', 'Two', '/two.png') +
  figure('/_img/three-800.webp', 'Three', '/three.png')

const single = figure('/_img/only-800.webp', 'Only', '/only.png')

const openImage = (alt: string) => fireEvent.click(screen.getByAltText(alt))
const dialog = () => document.querySelector('dialog')!
const shownImage = () => within(dialog()).getByRole('img') as HTMLImageElement
/** What Escape, the backdrop and a `method="dialog"` submit all surface as. */
const dismiss = () => fireEvent(dialog(), new Event('close'))
/** An <img>'s `src` property resolves against the document, unlike its attribute. */
const resolved = (path: string) => new URL(path, document.baseURI).href

describe('ArticleLightbox affordance', () => {
  it('marks every eligible image as an activatable control', () => {
    render(<Article html={gallery} />)

    for (const alt of ['One', 'Two', 'Three']) {
      const img = screen.getByAltText(alt)
      expect(img).toHaveAttribute('role', 'button')
      expect(img).toHaveAttribute('tabindex', '0')
      expect(img).toHaveAttribute('aria-label', `View full size: ${alt}`)
    }
  })

  it('names an image with no alt text generically rather than emptily', () => {
    render(<Article html={figure('/_img/x-800.webp', '', '/x.png')} />)

    expect(document.querySelector('article img, div img')).toHaveAttribute(
      'aria-label',
      'View full size: image'
    )
  })

  it('leaves a linked image completely alone', () => {
    // The xkcd image in 2017-moving-wordpress-hugo must still navigate to xkcd.com.
    render(<Article html={`<a href="https://xkcd.com/327/">${figure('/x.webp', 'Bobby')}</a>`} />)

    const img = screen.getByAltText('Bobby')
    expect(img).not.toHaveAttribute('role')
    expect(img).not.toHaveAttribute('tabindex')

    fireEvent.click(img)
    expect(dialog().open).toBe(false)
  })

  it('removes the affordance on unmount, leaving the image as it was served', () => {
    const { unmount } = render(<Article html={single} />)
    // Held across the unmount: the element outlives its detachment, so this asserts the
    // cleanup actually reverted it rather than the subtree merely disappearing.
    const img = screen.getByAltText('Only')
    expect(img).toHaveAttribute('role', 'button')

    unmount()

    expect(img).not.toHaveAttribute('role')
    expect(img).not.toHaveAttribute('tabindex')
    expect(img).not.toHaveAttribute('aria-label')
  })
})

describe('ArticleLightbox opening', () => {
  it('opens on click and shows the clicked image', () => {
    render(<Article html={gallery} />)

    openImage('Two')

    expect(dialog().open).toBe(true)
    expect(shownImage()).toHaveAttribute('alt', 'Two')
  })

  it.each([['Enter'], [' ']])('opens on %s, for keyboard users', (key) => {
    render(<Article html={gallery} />)

    fireEvent.keyDown(screen.getByAltText('One'), { key })

    expect(dialog().open).toBe(true)
    expect(shownImage()).toHaveAttribute('alt', 'One')
  })

  it('ignores other keys on an image', () => {
    render(<Article html={gallery} />)

    fireEvent.keyDown(screen.getByAltText('One'), { key: 'Tab' })

    expect(dialog().open).toBe(false)
  })

  it('ignores a click that misses an image', () => {
    render(<Article html={`<p>Some prose</p>${gallery}`} />)

    fireEvent.click(screen.getByText('Some prose'))

    expect(dialog().open).toBe(false)
  })

  it('shows the already-decoded variant first, not a blank frame', () => {
    render(<Article html={gallery} />)

    openImage('One')

    // The original is swapped in once it decodes; until then the reader sees the image
    // that is already on screen rather than an empty modal.
    expect(shownImage()).toHaveAttribute('src', resolved('/_img/one-800.webp'))
  })
})

describe('ArticleLightbox gallery', () => {
  it('moves with the arrow keys and wraps at both ends', () => {
    render(<Article html={gallery} />)
    openImage('One')

    fireEvent.keyDown(dialog(), { key: 'ArrowRight' })
    expect(shownImage()).toHaveAttribute('alt', 'Two')

    fireEvent.keyDown(dialog(), { key: 'ArrowLeft' })
    fireEvent.keyDown(dialog(), { key: 'ArrowLeft' })
    expect(shownImage()).toHaveAttribute('alt', 'Three')

    fireEvent.keyDown(dialog(), { key: 'ArrowRight' })
    expect(shownImage()).toHaveAttribute('alt', 'One')
  })

  it('moves with the on-screen controls', () => {
    render(<Article html={gallery} />)
    openImage('One')

    fireEvent.click(screen.getByLabelText('Next image'))
    expect(shownImage()).toHaveAttribute('alt', 'Two')

    fireEvent.click(screen.getByLabelText('Previous image'))
    expect(shownImage()).toHaveAttribute('alt', 'One')
  })

  it('reports the position in the gallery', () => {
    render(<Article html={gallery} />)
    openImage('Two')

    expect(within(dialog()).getByText('2 / 3')).toBeInTheDocument()
  })

  it('hides the controls entirely when the article has one image', () => {
    render(<Article html={single} />)
    openImage('Only')

    expect(screen.queryByLabelText('Next image')).toBeNull()
    expect(screen.queryByLabelText('Previous image')).toBeNull()
  })
})

describe('ArticleLightbox captions', () => {
  it('shows the caption when the image has one', () => {
    render(<Article html={gallery} />)
    openImage('One')

    expect(within(dialog()).getByText('First caption')).toBeInTheDocument()
  })

  it('renders no caption element at all when there is none, reserving no space', () => {
    render(<Article html={gallery} />)
    openImage('Two')

    expect(dialog().querySelector('figcaption')).toBeNull()
  })
})

describe('ArticleLightbox dismissal', () => {
  it('closes and returns focus to the image that opened it', () => {
    render(<Article html={gallery} />)
    const img = screen.getByAltText('Two')
    fireEvent.click(img)
    expect(dialog().open).toBe(true)

    // jsdom does not implement `<form method="dialog">` submission, so the close the
    // button triggers in a browser is simulated by the event it ultimately fires.
    dismiss()

    expect(dialog().open).toBe(false)
    expect(document.activeElement).toBe(img)
  })

  it('closes when the dialog emits close, however it was dismissed', () => {
    // Escape and the backdrop button both surface as the dialog's own close event.
    render(<Article html={gallery} />)
    openImage('One')

    dismiss()

    expect(dialog().open).toBe(false)
  })
})
