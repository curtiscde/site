import { getBannerRows, type BannerVariant } from './getBannerRows'
import type { BannerRow } from './buildRows'

/**
 * Proxy for on-screen speed: a row's track width is roughly its label characters
 * plus fixed per-item padding, and the track travels half its (doubled) width per
 * period — so width / duration is proportional to px/s.
 */
const PADDING_CHARS = 7 // 48px inline padding at ~6.5px per 13px glyph
const speed = (row: BannerRow) =>
  row.items.reduce((sum, item) => sum + item.label.length + PADDING_CHARS, 0) / row.durationSeconds

const averageSpeed = (variant: BannerVariant, kind: BannerRow['kind']) => {
  const rows = getBannerRows(variant).filter((row) => row.kind === kind)
  return rows.reduce((sum, row) => sum + speed(row), 0) / rows.length
}

describe('getBannerRows', () => {
  it.each(['compact', 'bare'] as const)('%s rows scroll at the homepage speed', (variant) => {
    for (const kind of ['tag', 'title'] as const) {
      const ratio = averageSpeed(variant, kind) / averageSpeed('full', kind)
      expect(ratio).toBeGreaterThan(0.75)
      expect(ratio).toBeLessThan(1.33)
    }
  })

  it('gives the bare banner one row of post titles and one of tags', () => {
    expect(getBannerRows('bare').map((row) => row.kind).sort()).toEqual(['tag', 'title'])
  })
})
