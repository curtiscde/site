'use client'

import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from 'd3-force'
import { ThemeContext } from '../../context/ThemeContext'
import { GraphLink, GraphNode } from '../../util/graph'
import { hitTest, labelVisible, screenToWorld, View, worldToScreen, zoomAbout } from './helpers'
import './TagGraph.scss'

type SimNode = GraphNode & SimulationNodeDatum
type SimLink = SimulationLinkDatum<SimNode>

interface Palette {
  tag: string
  post: string
  link: string
  linkDim: string
  linkActive: string
  label: string
  labelFocus: string
}

const PALETTES: Record<'light' | 'dark', Palette> = {
  light: {
    tag: 'oklch(49.12% 0.3096 275.75)',
    post: '#748297',
    link: 'rgba(40,55,85,.14)',
    linkDim: 'rgba(40,55,85,.05)',
    linkActive: 'rgba(73,30,255,.5)',
    label: '#475569',
    labelFocus: '#0f172a',
  },
  dark: {
    tag: 'oklch(65.69% 0.196 275.75)',
    post: '#8b97a8',
    link: 'rgba(255,255,255,.09)',
    linkDim: 'rgba(255,255,255,.04)',
    linkActive: 'rgba(140,120,255,.55)',
    label: '#c4cbd6',
    labelFocus: '#fff',
  },
}

const RESET_VIEW = { k: 0.7 }

interface TagGraphProps {
  nodes: GraphNode[]
  links: GraphLink[]
}

export function TagGraph({ nodes, links }: TagGraphProps) {
  const { theme } = useContext(ThemeContext)

  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Mutable interaction state kept in refs so the RAF draw loop reads the
  // latest values without re-running the setup effect.
  const viewRef = useRef<View>({ x: 0, y: 0, k: RESET_VIEW.k })
  const hoveredRef = useRef<SimNode | null>(null)
  const selectedRef = useRef<SimNode | null>(null)
  const queryRef = useRef('')
  const paletteRef = useRef<Palette>(PALETTES.light)
  const zoomControls = useRef<{ zoomBy: (f: number) => void; reset: () => void } | null>(null)
  // Timestamp of the last node-open, used to ignore the browser's synthetic
  // compatibility click that fires ~300ms after a tap and would otherwise
  // land on the freshly-rendered modal backdrop and close it instantly.
  const openedAtRef = useRef(0)

  // React state only for the DOM overlays (detail panel + tooltip + search).
  const [selected, setSelected] = useState<SimNode | null>(null)
  const [tip, setTip] = useState<{ label: string; x: number; y: number } | null>(null)
  const [query, setQuery] = useState('')

  // Adjacency built from the (still string-id) links, for hover highlighting.
  const adjacency = useMemo(() => {
    const adj = new Map<string, Set<string>>()
    nodes.forEach((n) => adj.set(n.id, new Set()))
    links.forEach(({ source, target }) => {
      adj.get(source)?.add(target)
      adj.get(target)?.add(source)
    })
    return adj
  }, [nodes, links])

  const postsByTag = useMemo(() => {
    const map = new Map<string, GraphNode[]>()
    nodes.forEach((n) => {
      if (n.kind !== 'post') return
      n.tags.forEach((tag) => {
        const key = `tag:${tag}`
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(n)
      })
    })
    return map
  }, [nodes])

  // Keep the palette ref in sync with the active theme, and re-read the
  // DaisyUI primary colour (if exposed as a CSS var) so the graph tracks any
  // theme customisation automatically.
  useEffect(() => {
    const base = theme === 'dark' ? PALETTES.dark : PALETTES.light
    const stage = stageRef.current
    const cssPrimary = stage ? getComputedStyle(stage).getPropertyValue('--color-primary').trim() : ''
    paletteRef.current = cssPrimary ? { ...base, tag: cssPrimary } : base
  }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0

    // d3-force mutates its inputs, so work on copies of the serialisable props.
    const simNodes: SimNode[] = nodes.map((n) => ({ ...n }))
    const byId = new Map(simNodes.map((n) => [n.id, n]))
    const simLinks: SimLink[] = links
      .filter((l) => byId.has(l.source) && byId.has(l.target))
      .map((l) => ({ source: l.source, target: l.target }))

    const simulation: Simulation<SimNode, SimLink> = forceSimulation(simNodes)
      .force('charge', forceManyBody<SimNode>().strength((n) => (n.kind === 'tag' ? -240 : -90)))
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((n) => n.id)
          .distance(95)
          .strength(0.35),
      )
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide<SimNode>((n) => n.radius + 2))
      .velocityDecay(0.18)

    const resize = () => {
      width = stage.clientWidth
      height = stage.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      viewRef.current = { ...viewRef.current, x: width / 2, y: height / 2 }
    }
    resize()
    const resizeObserver = new ResizeObserver(() => {
      resize()
      simulation.alpha(Math.max(simulation.alpha(), 0.3)).restart()
    })
    resizeObserver.observe(stage)

    const highlightSet = (): Set<string> | null => {
      const focus = hoveredRef.current || selectedRef.current
      if (!focus) return null
      const set = new Set<string>([focus.id])
      adjacency.get(focus.id)?.forEach((id) => set.add(id))
      return set
    }
    const matches = (n: SimNode) =>
      queryRef.current.length > 0 && n.kind === 'tag' && n.label.toLowerCase().includes(queryRef.current)

    const draw = () => {
      const view = viewRef.current
      const pal = paletteRef.current
      const hl = highlightSet()
      const hasQuery = queryRef.current.length > 0
      const nodeScale = Math.max(0.7, Math.min(view.k, 2.2))

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      // edges
      for (const l of simLinks) {
        const a = l.source as SimNode
        const b = l.target as SimNode
        if (a.x == null || b.x == null) continue
        const active = !!hl && hl.has(a.id) && hl.has(b.id)
        ctx.strokeStyle = active ? pal.linkActive : hl ? pal.linkDim : pal.link
        ctx.lineWidth = active ? 1.4 : 0.7
        const pa = worldToScreen(a.x!, a.y!, view)
        const pb = worldToScreen(b.x!, b.y!, view)
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.stroke()
      }

      // nodes
      for (const n of simNodes) {
        if (n.x == null) continue
        const p = worldToScreen(n.x, n.y!, view)
        const r = n.radius * nodeScale
        const focused = !!hl && hl.has(n.id)
        const dim = (hl && !focused) || (hasQuery && !matches(n) && !focused)
        ctx.globalAlpha = dim ? 0.18 : 1
        if (n.kind === 'tag' && matches(n)) {
          ctx.shadowColor = 'rgba(120,110,255,.9)'
          ctx.shadowBlur = 18
        }
        ctx.fillStyle = n.kind === 'tag' ? pal.tag : pal.post
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }

      // tag labels
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      for (const n of simNodes) {
        if (n.x == null) continue
        const focused = (!!hl && hl.has(n.id)) || matches(n)
        if (!labelVisible(n, view.k, focused)) continue
        const dim = (hl && !hl.has(n.id)) || (hasQuery && !matches(n) && !focused)
        const p = worldToScreen(n.x, n.y!, view)
        const r = n.radius * nodeScale
        ctx.font = `${focused ? 600 : 500} ${Math.max(10, 11 * Math.min(view.k, 1.4))}px ui-sans-serif, system-ui, sans-serif`
        ctx.globalAlpha = dim ? 0.22 : 0.95
        ctx.fillStyle = focused ? pal.labelFocus : pal.label
        ctx.fillText(n.label, p.x, p.y + r + 3)
        ctx.globalAlpha = 1
      }
    }

    let raf = 0
    const frame = () => {
      draw()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // ---- interaction ----
    const relPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const pick = (mx: number, my: number) => {
      const w = screenToWorld(mx, my, viewRef.current)
      return hitTest(
        simNodes.filter((n): n is SimNode & { x: number; y: number } => n.x != null && n.y != null),
        w.x,
        w.y,
        viewRef.current.k,
      )
    }

    let dragNode: SimNode | null = null
    let panning = false
    let downPt: { x: number; y: number } | null = null
    let last: { x: number; y: number } | null = null
    let moved = false

    const onMouseDown = (e: MouseEvent) => {
      const m = relPos(e)
      downPt = m
      last = m
      moved = false
      const n = pick(m.x, m.y)
      if (n) {
        dragNode = n
        n.fx = n.x
        n.fy = n.y
        simulation.alphaTarget(0.3).restart()
      } else {
        panning = true
        canvas.classList.add('grabbing')
      }
    }
    const onMouseMove = (e: MouseEvent) => {
      const m = relPos(e)
      if (downPt && (Math.abs(m.x - downPt.x) > 3 || Math.abs(m.y - downPt.y) > 3)) moved = true
      if (dragNode) {
        const w = screenToWorld(m.x, m.y, viewRef.current)
        dragNode.fx = w.x
        dragNode.fy = w.y
      } else if (panning && last) {
        viewRef.current = { ...viewRef.current, x: viewRef.current.x + (m.x - last.x), y: viewRef.current.y + (m.y - last.y) }
      } else {
        const n = pick(m.x, m.y)
        hoveredRef.current = n
        canvas.style.cursor = n ? 'pointer' : 'grab'
        if (n) setTip({ label: n.kind === 'tag' ? `#${n.label} · ${n.count} post${n.count === 1 ? '' : 's'}` : n.label, x: m.x, y: m.y })
        else setTip(null)
      }
      last = m
    }
    const onMouseUp = () => {
      if (dragNode) {
        if (!moved) openNode(dragNode)
        // Leave fx/fy set so a dragged node stays pinned where it was dropped.
        simulation.alphaTarget(0)
      } else if (panning && !moved) {
        selectedRef.current = null
        setSelected(null)
      }
      dragNode = null
      panning = false
      canvas.classList.remove('grabbing')
      downPt = null
    }
    const onDblClick = (e: MouseEvent) => {
      const m = relPos(e)
      const n = pick(m.x, m.y)
      if (n) window.location.href = n.href
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const m = relPos(e)
      viewRef.current = zoomAbout(viewRef.current, m.x, m.y, Math.exp(-e.deltaY * 0.0016))
    }
    const openNode = (n: SimNode) => {
      openedAtRef.current = Date.now()
      selectedRef.current = n
      setSelected(n)
      // Clear any lingering hover tooltip so it doesn't overlap the detail
      // panel — notably on touch, where a tap synthesises a hover first.
      hoveredRef.current = null
      setTip(null)
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('dblclick', onDblClick)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // Expose zoom/reset controls to the React overlay buttons.
    zoomControls.current = {
      zoomBy: (factor: number) => {
        viewRef.current = zoomAbout(viewRef.current, width / 2, height / 2, factor)
      },
      reset: () => {
        viewRef.current = { x: width / 2, y: height / 2, k: RESET_VIEW.k }
        simulation.alpha(Math.max(simulation.alpha(), 0.5)).restart()
      },
    }

    return () => {
      cancelAnimationFrame(raf)
      simulation.stop()
      resizeObserver.disconnect()
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('dblclick', onDblClick)
      canvas.removeEventListener('wheel', onWheel)
      zoomControls.current = null
    }
  }, [nodes, links, adjacency])

  const closePanel = () => {
    selectedRef.current = null
    setSelected(null)
  }

  // Backdrop tap-to-dismiss, but swallow the synthetic click that immediately
  // follows the tap which opened the panel (see openedAtRef).
  const onBackdropClick = () => {
    if (Date.now() - openedAtRef.current < 350) return
    closePanel()
  }

  return (
    <div className="container mx-auto px-4">
      <div ref={stageRef} className="tg-stage relative overflow-hidden rounded-[14px]">
        <canvas ref={canvasRef} className="tg-canvas block h-full w-full" />

        {/* search */}
        <div className="tg-panel absolute left-4 top-4 flex items-center gap-2 rounded-[10px] px-3 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            aria-label="Search tags"
            placeholder="Search tags…"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              const q = e.target.value.trim().toLowerCase()
              setQuery(e.target.value)
              queryRef.current = q
            }}
            className="tg-search w-[180px] max-w-[52vw] border-none bg-transparent text-sm outline-none"
          />
        </div>

        {/* legend */}
        <div className="tg-panel absolute bottom-4 left-4 flex items-center gap-4 rounded-[10px] px-3.5 py-2 text-[13px]">
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-primary" />
            Tag
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-base-content/50" />
            Post
          </span>
          <span className="opacity-60">node size = post count</span>
        </div>

        {/* zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button className="tg-btn" aria-label="Zoom in" onClick={() => zoomControls.current?.zoomBy(1.25)}>
            +
          </button>
          <button className="tg-btn" aria-label="Zoom out" onClick={() => zoomControls.current?.zoomBy(0.8)}>
            −
          </button>
          <button className="tg-btn text-sm" aria-label="Reset view" title="Reset view" onClick={() => zoomControls.current?.reset()}>
            ⟳
          </button>
        </div>

        {/* detail panel */}
        {selected && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4 sm:inset-auto sm:right-4 sm:top-4 sm:z-10 sm:block sm:bg-transparent sm:p-0"
            onClick={onBackdropClick}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="tg-detail relative max-h-full w-full max-w-sm overflow-auto rounded-2xl p-[18px] sm:max-h-[calc(100%-2rem)] sm:w-[300px] sm:rounded-xl"
            >
              <button
                aria-label="Close details"
                onClick={closePanel}
                className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-md text-base-content/50 hover:bg-base-content/10"
              >
                ✕
              </button>
              <DetailBody node={selected} posts={postsByTag.get(selected.id) ?? []} onNavigate={closePanel} />
            </div>
          </div>
        )}

        {/* hover tooltip */}
        {tip && (
          <div
            className="tg-tip pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[140%] whitespace-nowrap rounded-md px-2.5 py-1 text-[12.5px]"
            style={{ left: tip.x, top: tip.y }}
          >
            {tip.label}
          </div>
        )}
      </div>
      <p className="mx-1 mt-3 text-[13px] text-base-content/60">
        Drag nodes to rearrange · scroll to zoom · drag the background to pan · click a tag to see its posts and open its tag page.
      </p>
    </div>
  )
}

interface DetailBodyProps {
  node: GraphNode
  posts: GraphNode[]
  onNavigate: () => void
}

function DetailBody({ node, posts, onNavigate }: DetailBodyProps) {
  if (node.kind === 'tag') {
    return (
      <>
        <div className="text-xs font-bold uppercase tracking-wider text-primary">Tag</div>
        <div className="mb-0.5 mt-0.5 text-[22px] font-extrabold text-base-content">{node.label}</div>
        <div className="mb-3 text-[13px] text-base-content/60">
          {node.count} post{node.count === 1 ? '' : 's'}
        </div>
        <a href={node.href} className="btn btn-primary btn-sm mb-3.5" onClick={onNavigate}>
          View all posts tagged {node.label} →
        </a>
        <div className="flex flex-col">
          {posts.map((p) => (
            <a
              key={p.id}
              href={p.href}
              onClick={onNavigate}
              className="border-t border-base-200 py-1.5 text-sm text-base-content/80 hover:text-primary"
            >
              {p.label}
            </a>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="text-xs font-bold uppercase tracking-wider text-base-content/60">Post</div>
      <div className="mb-3 mt-0.5 text-lg font-extrabold leading-tight text-base-content">{node.label}</div>
      <a href={node.href} className="btn btn-primary btn-sm mb-3.5" onClick={onNavigate}>
        Read post →
      </a>
      <div className="flex flex-wrap gap-2">
        {node.tags.map((tag) => (
          <a
            key={tag}
            href={`/tag/${tag}`}
            onClick={onNavigate}
            className="rounded-[1.9rem] border border-primary/40 px-2.5 py-0.5 text-[12.5px] text-primary"
          >
            {tag}
          </a>
        ))}
      </div>
    </>
  )
}
