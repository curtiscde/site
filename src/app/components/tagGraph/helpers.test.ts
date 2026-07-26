import {
  clampK,
  hitTest,
  K_MAX,
  K_MIN,
  labelVisible,
  PositionedNode,
  screenToWorld,
  View,
  worldToScreen,
  zoomAbout,
} from './helpers'

describe('clampK', () => {
  it('leaves an in-range factor untouched', () => {
    expect(clampK(1)).toBe(1)
  })
  it('clamps below the minimum', () => {
    expect(clampK(0.01)).toBe(K_MIN)
  })
  it('clamps above the maximum', () => {
    expect(clampK(99)).toBe(K_MAX)
  })
})

describe('screenToWorld / worldToScreen', () => {
  const view: View = { x: 100, y: 50, k: 2 }

  it('round-trips a point back to itself', () => {
    const w = screenToWorld(300, 250, view)
    const s = worldToScreen(w.x, w.y, view)
    expect(s.x).toBeCloseTo(300)
    expect(s.y).toBeCloseTo(250)
  })

  it('maps the pan origin to the world origin', () => {
    expect(screenToWorld(100, 50, view)).toEqual({ x: 0, y: 0 })
  })
})

describe('zoomAbout', () => {
  const view: View = { x: 200, y: 200, k: 1 }

  it('keeps the world point under the cursor fixed', () => {
    const px = 320
    const py = 140
    const before = screenToWorld(px, py, view)
    const next = zoomAbout(view, px, py, 1.5)
    const after = screenToWorld(px, py, next)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })

  it('scales k by the factor', () => {
    expect(zoomAbout(view, 0, 0, 1.5).k).toBeCloseTo(1.5)
  })

  it('respects the zoom clamp', () => {
    expect(zoomAbout(view, 0, 0, 100).k).toBe(K_MAX)
    expect(zoomAbout(view, 0, 0, 0.001).k).toBe(K_MIN)
  })
})

describe('hitTest', () => {
  const nodes: PositionedNode[] = [
    { x: 0, y: 0, radius: 5 },
    { x: 50, y: 0, radius: 5 },
  ]

  it('returns the node when the point is within its hit radius', () => {
    expect(hitTest(nodes, 1, 1, 1)).toBe(nodes[0])
  })

  it('returns null when the point misses every node', () => {
    expect(hitTest(nodes, 25, 25, 1)).toBeNull()
  })

  it('returns the nearest node when several overlap', () => {
    const near = hitTest(nodes, 48, 0, 1)
    expect(near).toBe(nodes[1])
  })

  it('enlarges the hit radius as the view zooms out', () => {
    // 20px away from a radius-5 node: a miss at k=1 (hitR=11) …
    expect(hitTest([nodes[0]], 20, 0, 1)).toBeNull()
    // … but a hit at k=0.3 (hitR = 11 / 0.3 ≈ 36.7).
    expect(hitTest([nodes[0]], 20, 0, 0.3)).toBe(nodes[0])
  })
})

describe('labelVisible', () => {
  it('never shows post labels', () => {
    expect(labelVisible({ kind: 'post' }, 5, true)).toBe(false)
  })

  it('shows a focused tag label at any zoom', () => {
    expect(labelVisible({ kind: 'tag', count: 1 }, 0.5, true)).toBe(true)
  })

  it('shows a popular tag (count >= 5) even when unfocused and zoomed out', () => {
    expect(labelVisible({ kind: 'tag', count: 5 }, 0.5, false)).toBe(true)
  })

  it('shows any tag once zoomed in past k > 1.25', () => {
    expect(labelVisible({ kind: 'tag', count: 1 }, 1.3, false)).toBe(true)
  })

  it('hides a small, unfocused tag when zoomed out', () => {
    expect(labelVisible({ kind: 'tag', count: 2 }, 1, false)).toBe(false)
  })
})
