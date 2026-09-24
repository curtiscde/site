import { buildRows, type BannerItem } from './buildRows'

const items = (prefix: string, count: number): BannerItem[] =>
  Array.from({ length: count }, (_, i) => ({ label: `${prefix}${i}`, href: `/${prefix}/${i}` }))

const base = {
  titles: items('t', 12),
  tags: items('g', 20),
  titleRowCount: 3,
  tagRowCount: 3,
  minOpacity: 0.1,
  maxOpacity: 0.3,
  titleDurationSeconds: 200,
  tagDurationSeconds: 100,
}

describe('buildRows', () => {
  it('returns one row per requested row, of both kinds', () => {
    const rows = buildRows(base)
    expect(rows).toHaveLength(6)
    expect(rows.filter((r) => r.kind === 'title')).toHaveLength(3)
    expect(rows.filter((r) => r.kind === 'tag')).toHaveLength(3)
  })

  it('interleaves the two kinds rather than stacking them', () => {
    expect(buildRows(base).map((r) => r.kind)).toEqual([
      'title', 'tag', 'title', 'tag', 'title', 'tag',
    ])
  })

  it('places every item exactly once', () => {
    const rows = buildRows(base)
    const hrefs = rows.flatMap((r) => r.items.map((i) => i.href))

    expect(hrefs).toHaveLength(32)
    expect(new Set(hrefs).size).toBe(32)
  })

  it('deals round-robin so rows get a spread rather than a contiguous clump', () => {
    const rows = buildRows(base)
    const firstTitleRow = rows.find((r) => r.kind === 'title')

    expect(firstTitleRow?.items.map((i) => i.label)).toEqual(['t0', 't3', 't6', 't9'])
  })

  it('alternates direction row by row', () => {
    expect(buildRows(base).map((r) => r.direction)).toEqual([
      'left', 'right', 'left', 'right', 'left', 'right',
    ])
  })

  describe('opacity ramp', () => {
    it('is faintest at the edges and strongest in the middle', () => {
      const rows = buildRows(base)
      const opacities = rows.map((r) => r.opacity)

      expect(opacities[0]).toBe(base.minOpacity)
      expect(opacities[opacities.length - 1]).toBe(base.minOpacity)
      expect(Math.max(...opacities)).toBeGreaterThan(opacities[0])
    })

    it('is symmetrical about the centre', () => {
      const opacities = buildRows(base).map((r) => r.opacity)
      expect(opacities).toEqual([...opacities].reverse())
    })

    it('never exceeds the configured bounds', () => {
      buildRows(base).forEach(({ opacity }) => {
        expect(opacity).toBeGreaterThanOrEqual(base.minOpacity)
        expect(opacity).toBeLessThanOrEqual(base.maxOpacity)
      })
    })

    it('gives a lone row the maximum, since there is no ramp to describe', () => {
      const rows = buildRows({ ...base, titleRowCount: 0, tagRowCount: 1 })
      expect(rows).toHaveLength(1)
      expect(rows[0].opacity).toBe(base.maxOpacity)
    })

    it('gives a pair of rows the maximum, since neither is an outer row framing a middle', () => {
      const rows = buildRows({ ...base, titleRowCount: 1, tagRowCount: 1 })
      expect(rows.map((r) => r.opacity)).toEqual([base.maxOpacity, base.maxOpacity])
    })
  })

  describe('durations', () => {
    it('runs title rows slower than tag rows', () => {
      const rows = buildRows(base)
      const title = rows.find((r) => r.kind === 'title')!
      const tag = rows.find((r) => r.kind === 'tag')!

      expect(title.durationSeconds).toBeGreaterThan(tag.durationSeconds)
    })

    it('offsets each row so the tracks never resynchronise into one pulse', () => {
      const rows = buildRows(base)
      const titleDurations = rows.filter((r) => r.kind === 'title').map((r) => r.durationSeconds)

      expect(new Set(titleDurations).size).toBe(titleDurations.length)
    })
  })

  describe('bare composition', () => {
    it('builds one title row then one tag row, each carrying every item of its kind', () => {
      const rows = buildRows({ ...base, titleRowCount: 1, tagRowCount: 1 })

      expect(rows.map((r) => r.kind)).toEqual(['title', 'tag'])
      expect(rows[0].items).toHaveLength(base.titles.length)
      expect(rows[1].items).toHaveLength(base.tags.length)
    })
  })

  it('tolerates fewer items than rows without producing empty gaps mid-list', () => {
    const rows = buildRows({ ...base, titles: items('t', 2), titleRowCount: 3 })
    const titleRows = rows.filter((r) => r.kind === 'title')

    expect(titleRows).toHaveLength(3)
    expect(titleRows.flatMap((r) => r.items)).toHaveLength(2)
  })
})
