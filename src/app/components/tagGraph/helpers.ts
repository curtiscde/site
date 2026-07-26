import { GraphNode } from '../../util/graph'

export interface View {
  x: number
  y: number
  k: number
}

export const K_MIN = 0.3
export const K_MAX = 4

/** Clamp a zoom factor to the allowed range. */
export const clampK = (k: number) => Math.max(K_MIN, Math.min(K_MAX, k))

/** Convert a screen-space point to world (graph) coordinates. */
export const screenToWorld = (sx: number, sy: number, view: View) => ({
  x: (sx - view.x) / view.k,
  y: (sy - view.y) / view.k,
})

/** Convert a world (graph) point to screen coordinates. */
export const worldToScreen = (wx: number, wy: number, view: View) => ({
  x: wx * view.k + view.x,
  y: wy * view.k + view.y,
})

/**
 * Zoom by `factor` about a fixed screen point (`px`, `py`) — the world point
 * under that pixel stays under it after the zoom. Returns a new View.
 */
export const zoomAbout = (view: View, px: number, py: number, factor: number): View => {
  const w = screenToWorld(px, py, view)
  const k = clampK(view.k * factor)
  return { k, x: px - w.x * k, y: py - w.y * k }
}

export interface PositionedNode {
  x: number
  y: number
  radius: number
}

/**
 * Return the node nearest to a world-space point that lies within its hit
 * radius, or null. Hit radius grows as you zoom out (divided by `k`) so nodes
 * stay clickable at any zoom.
 */
export function hitTest<T extends PositionedNode>(
  nodes: T[],
  worldX: number,
  worldY: number,
  k: number,
): T | null {
  let best: T | null = null
  let bestD = Infinity
  for (const n of nodes) {
    const dx = n.x - worldX
    const dy = n.y - worldY
    const d = Math.hypot(dx, dy)
    const hitR = (n.radius + 6) / k
    if (d < hitR && d < bestD) {
      bestD = d
      best = n
    }
  }
  return best
}

/**
 * Whether a tag node's label should be drawn. Post labels are hover-only
 * (handled by the tooltip), so this only ever returns true for tags: when the
 * tag is focused (hovered / selected / search-matched), has >= 5 posts, or the
 * view is zoomed in past k > 1.25.
 */
export function labelVisible(node: Pick<GraphNode, 'kind'> & { count?: number }, k: number, focused: boolean): boolean {
  if (node.kind !== 'tag') return false
  if (focused) return true
  return (node.count ?? 0) >= 5 || k > 1.25
}
