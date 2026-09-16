import { targetWidths } from '../../../../scripts/generate-image-variants.mjs'

describe('targetWidths', () => {
  it('emits the full ladder for a source wider than the maximum', () => {
    expect(targetWidths(2488)).toEqual([96, 200, 400, 800, 1200, 1600])
  })

  it('never upscales', () => {
    expect(targetWidths(500).every((w: number) => w <= 500)).toBe(true)
    expect(targetWidths(300)).toEqual([96, 200, 300])
    // Smaller than every rung: the source's own width is the only candidate.
    expect(targetWidths(80)).toEqual([80])
  })

  it('always ends at the source width when that is below the maximum', () => {
    // Regression: a 768px source previously yielded [400] alone, so the widest variant
    // was 400w and the browser upscaled it into a ~720px column.
    expect(targetWidths(768)).toEqual([96, 200, 400, 768])
    expect(targetWidths(1000)).toEqual([96, 200, 400, 800, 1000])
  })

  it('stops at the maximum rather than emitting a native-width variant', () => {
    expect(targetWidths(4000)).toEqual([96, 200, 400, 800, 1200, 1600])
    expect(targetWidths(1600)).toEqual([96, 200, 400, 800, 1200, 1600])
  })

  it('returns strictly ascending widths with no duplicates', () => {
    for (const native of [40, 96, 97, 200, 400, 401, 800, 1200, 1599, 1600, 1601, 3000]) {
      const widths = targetWidths(native)
      expect(widths).toEqual([...new Set(widths)])
      expect([...widths].sort((a: number, b: number) => a - b)).toEqual(widths)
    }
  })
  // The rungs site chrome needs: a 40px avatar at 2x wants 96, a 56px logo tile wants 200.
  it('offers a rung small enough for chrome, not just an article column', () => {
    expect(targetWidths(600)).toEqual([96, 200, 400, 600])
    expect(targetWidths(200)).toEqual([96, 200])
  })
})
