import { DOUBLE_TAP_SCALE, isDoubleTap, maxScaleFor } from './useLightboxZoom'

/** jsdom does no layout or decoding, so the sizes a browser would report are set here. */
const sized = (natural: [number, number], client: [number, number]): HTMLImageElement => {
  const img = document.createElement('img')
  const sizes = {
    naturalWidth: natural[0],
    naturalHeight: natural[1],
    clientWidth: client[0],
    clientHeight: client[1],
  }
  for (const [key, value] of Object.entries(sizes)) {
    Object.defineProperty(img, key, { value })
  }
  return img
}

describe('maxScaleFor', () => {
  it('lets a wide screenshot zoom until one original pixel fills one CSS pixel', () => {
    // A 2400px screenshot on a 390px-wide phone.
    expect(maxScaleFor(sized([2400, 1200], [390, 700]))).toBeCloseTo(2400 / 390)
  })

  it('measures the letterboxed picture, not the element, for a tall image', () => {
    // object-fit: contain paints a 1000×4000 image only 175px wide in a 390×700 box.
    expect(maxScaleFor(sized([1000, 4000], [390, 700]))).toBeCloseTo(1000 / 175)
  })

  it('still allows a useful zoom on an image smaller than the screen', () => {
    expect(maxScaleFor(sized([200, 100], [390, 700]))).toBe(DOUBLE_TAP_SCALE)
  })

  it('falls back to the double-tap scale before the image has a size', () => {
    expect(maxScaleFor(sized([0, 0], [0, 0]))).toBe(DOUBLE_TAP_SCALE)
  })
})

describe('isDoubleTap', () => {
  const first = { time: 1000, x: 100, y: 100 }

  it('accepts a second tap soon after and close by', () => {
    expect(isDoubleTap(first, { time: 1200, x: 110, y: 105 })).toBe(true)
  })

  it('rejects a second tap that comes too late', () => {
    expect(isDoubleTap(first, { time: 1400, x: 100, y: 100 })).toBe(false)
  })

  it('rejects a second tap somewhere else on the image', () => {
    expect(isDoubleTap(first, { time: 1100, x: 200, y: 100 })).toBe(false)
  })

  it('rejects a first tap', () => {
    expect(isDoubleTap(null, first)).toBe(false)
  })
})
